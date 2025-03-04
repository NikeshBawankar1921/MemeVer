import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage, db, auth } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { HiUpload, HiOutlineX, HiLightningBolt, HiPhotograph, HiScissors, HiPencil, HiCheck } from 'react-icons/hi';
import { IMGBB_API_KEY } from '../config/constants';
import Cropper from 'react-easy-crop';
import { showSuccessToast, showErrorToast } from '../utils/toast';

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [captionPosition, setCaptionPosition] = useState('bottom'); // 'top', 'bottom', 'center'
  const [editMode, setEditMode] = useState(false); // 'crop', 'text', null
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState('text-xl');
  const [textBorderColor, setTextBorderColor] = useState('#000000');
  const [textBorderWidth, setTextBorderWidth] = useState('2px');
  const [customTexts, setCustomTexts] = useState([]);
  const [currentCustomText, setCurrentCustomText] = useState('');
  const [activeTextId, setActiveTextId] = useState(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const navigate = useNavigate();
  const user = auth.currentUser;

  const textSizeOptions = [
    { value: 'text-sm', label: 'Small' },
    { value: 'text-xl', label: 'Medium' },
    { value: 'text-3xl', label: 'Large' },
    { value: 'text-5xl', label: 'Extra Large' }
  ];

  useEffect(() => {
    // Check if there's a template to edit in sessionStorage
    const templateData = sessionStorage.getItem('templateToEdit');
    if (templateData) {
      try {
        const template = JSON.parse(templateData);
        
        // Create a fetch request to get the image as a blob
        fetch(template.file)
          .then(response => response.blob())
          .then(blob => {
            // Create a File object from the blob
            const file = new File([blob], `template-${template.name.replace(/\s+/g, '-')}.jpg`, {
              type: 'image/jpeg'
            });
            
            // Set the file and preview URL
            setFile(file);
            setPreviewUrl(template.file);
            setCaption(template.name); // Optional: set the template name as initial caption
            
            // Clear the sessionStorage to prevent reloading on refresh
            sessionStorage.removeItem('templateToEdit');
            
            // Set preview mode to true to show the editing interface
            setPreviewMode(true);
          })
          .catch(error => {
            console.error('Error loading template:', error);
            toast.error('Failed to load template for editing');
          });
      } catch (error) {
        console.error('Error parsing template data:', error);
      }
    }
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      // Reset editing states
      setEditMode(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setCustomTexts([]);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async () => {
    try {
      const image = await createImage(previewUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const maxSize = Math.max(image.width, image.height);
      const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

      // Set canvas size to match the cropped area
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      // Draw the cropped image
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      // Convert canvas to blob
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg');
      });
    } catch (e) {
      console.error('Error creating cropped image:', e);
      return null;
    }
  };

  const applyCrop = async () => {
    if (!croppedAreaPixels) {
      toast.error('Please crop the image first');
      return;
    }

    try {
      const croppedBlob = await getCroppedImg();
      if (croppedBlob) {
        // Create a new file from the blob
        const croppedFile = new File([croppedBlob], 'cropped-image.jpeg', {
          type: 'image/jpeg',
        });
        
        setFile(croppedFile);
        setPreviewUrl(URL.createObjectURL(croppedFile));
        setEditMode(null);
        toast.success('Image cropped successfully!');
      }
    } catch (error) {
      console.error('Error applying crop:', error);
      toast.error('Failed to crop image');
    }
  };

  const addCustomText = () => {
    if (!currentCustomText.trim()) {
      toast.error('Please enter text to add');
      return;
    }

    setCustomTexts([
      ...customTexts,
      {
        id: Date.now(),
        text: currentCustomText,
        color: textColor,
        size: textSize,
        borderColor: textBorderColor,
        borderWidth: textBorderWidth,
        position: { x: 50, y: 50 } // Default position in percentage
      }
    ]);
    setCurrentCustomText('');
    toast.success('Text added! You can drag it to position on the image.');
  };

  const removeCustomText = (id) => {
    setCustomTexts(customTexts.filter(text => text.id !== id));
  };

  const handleDragStart = (e, id) => {
    setActiveTextId(id);
    // Prevent default behavior to avoid browser's default drag behavior
    e.preventDefault();
  };

  const handleDragMove = (e) => {
    if (!activeTextId || !imageRef.current) return;
    
    // Get image dimensions and position
    const imageRect = imageRef.current.getBoundingClientRect();
    
    // Calculate position in percentage relative to the image
    const x = ((e.clientX - imageRect.left) / imageRect.width) * 100;
    const y = ((e.clientY - imageRect.top) / imageRect.height) * 100;
    
    // Ensure the text stays within the image boundaries
    const boundedX = Math.max(0, Math.min(100, x));
    const boundedY = Math.max(0, Math.min(100, y));
    
    // Update the position of the active text
    setCustomTexts(prevTexts => 
      prevTexts.map(text => 
        text.id === activeTextId 
          ? { ...text, position: { x: boundedX, y: boundedY } } 
          : text
      )
    );
  };

  const handleDragEnd = () => {
    setActiveTextId(null);
  };

  const generateAICaption = async () => {
    if (!file) {
      toast.error('Please upload an image first');
      return;
    }

    setIsGeneratingCaption(true);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{
            role: "user",
            content: "Generate a funny and creative meme caption for an image. Make it short and witty."
          }]
        })
      });

      const data = await response.json();
      if (data.choices && data.choices[0]) {
        setCaption(data.choices[0].message.content);
        toast.success('AI caption generated!');
      }
    } catch (error) {
      console.error('Error generating caption:', error);
      toast.error('Failed to generate AI caption');
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const createFinalMemeImage = async () => {
    if (!file) return null;
    
    try {
      const image = await createImage(previewUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas dimensions to match image
      canvas.width = image.width;
      canvas.height = image.height;
      
      // Draw the base image
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      
      // Add the main caption if it exists
      if (caption) {
        ctx.textAlign = 'center';
        ctx.font = '30px Impact';
        
        // Text with border (stroke)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
        ctx.fillStyle = '#ffffff';
        
        const x = canvas.width / 2;
        let y;
        
        if (captionPosition === 'top') {
          y = 40;
        } else if (captionPosition === 'bottom') {
          y = canvas.height - 20;
        } else { // center
          y = canvas.height / 2;
        }
        
        // Draw text with stroke (border)
        ctx.strokeText(caption, x, y);
        ctx.fillText(caption, x, y);
      }
      
      // Add custom texts
      customTexts.forEach(textItem => {
        ctx.textAlign = 'center';
        
        // Set font size based on textItem.size
        let fontSize = 30; // default medium
        if (textItem.size === 'text-sm') fontSize = 20;
        if (textItem.size === 'text-3xl') fontSize = 40;
        if (textItem.size === 'text-5xl') fontSize = 60;
        
        ctx.font = `${fontSize}px Impact`;
        
        // Text with border
        ctx.strokeStyle = textItem.borderColor;
        ctx.lineWidth = parseInt(textItem.borderWidth);
        ctx.fillStyle = textItem.color;
        
        // Calculate position based on percentage
        const x = (textItem.position.x / 100) * canvas.width;
        const y = (textItem.position.y / 100) * canvas.height;
        
        // Draw text with stroke (border)
        ctx.strokeText(textItem.text, x, y);
        ctx.fillText(textItem.text, x, y);
      });
      
      // Convert canvas to blob
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.95);
      });
    } catch (error) {
      console.error('Error creating final meme image:', error);
      return null;
    }
  };

  const handleUpload = async () => {
    if (!user) {
      toast.error('You must be logged in to upload memes');
      navigate('/auth/login');
      return;
    }

    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsLoading(true);
    try {
      // Create the final meme image with all text and edits
      const finalMemeBlob = await createFinalMemeImage();
      const finalMemeFile = finalMemeBlob ? new File([finalMemeBlob], 'meme.jpeg', { type: 'image/jpeg' }) : file;
      
      const formData = new FormData();
      formData.append('image', finalMemeFile);
      formData.append('key', IMGBB_API_KEY);

      // Upload to ImgBB
      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        // Add to Firestore memes collection
        const memeDoc = await addDoc(collection(db, 'memes'), {
          imageUrl: data.data.url,
          caption,
          captionPosition,
          userId: user.uid,
          username: user.displayName || 'Anonymous',
          createdAt: new Date().toISOString(),
          likes: 0,
          comments: []
        });

        // Also add to user's uploaded memes in their profile
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          uploadedMemes: arrayUnion({
            id: memeDoc.id,
            imageUrl: data.data.url,
            caption,
            createdAt: new Date().toISOString()
          })
        });

        showSuccessToast('Meme uploaded successfully!');
        // Navigate to home page instead of meme detail page
        navigate('/');
      }
    } catch (error) {
      console.error('Error uploading meme:', error);
      showErrorToast('Failed to upload meme');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-8">Create Your Meme</h1>
      
      <div className="flex flex-col items-center space-y-4">
        {!file ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors"
          >
            <HiPhotograph className="w-12 h-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Click to upload your meme template</p>
          </div>
        ) : (
          <div className="relative w-full">
            {editMode === 'crop' ? (
              <div className="relative h-96 w-full">
                <Cropper
                  image={previewUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-1/2"
                  />
                  <button
                    onClick={applyCrop}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    <HiCheck className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setEditMode(null)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <HiOutlineX className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : editMode === 'text' ? (
              <div className="w-full space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">Add Custom Text</h3>
                <div className="flex flex-col space-y-4">
                  <input
                    type="text"
                    value={currentCustomText}
                    onChange={(e) => setCurrentCustomText(e.target.value)}
                    placeholder="Enter your text here..."
                    className="p-2 border rounded-lg"
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Text Color</label>
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="mt-1 p-1 w-full rounded-lg"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Border Color</label>
                      <input
                        type="color"
                        value={textBorderColor}
                        onChange={(e) => setTextBorderColor(e.target.value)}
                        className="mt-1 p-1 w-full rounded-lg"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Text Size</label>
                      <select
                        value={textSize}
                        onChange={(e) => setTextSize(e.target.value)}
                        className="mt-1 p-2 w-full border rounded-lg"
                      >
                        {textSizeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Border Width</label>
                      <select
                        value={textBorderWidth}
                        onChange={(e) => setTextBorderWidth(e.target.value)}
                        className="mt-1 p-2 w-full border rounded-lg"
                      >
                        <option value="1px">Thin</option>
                        <option value="2px">Medium</option>
                        <option value="3px">Thick</option>
                        <option value="4px">Extra Thick</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setEditMode(null)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addCustomText}
                      className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                    >
                      Add Text
                    </button>
                    {customTexts.length > 0 && (
                      <button
                        onClick={() => {
                          setEditMode(null);
                          toast.success('Text applied to image!');
                        }}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        Apply Text
                      </button>
                    )}
                  </div>
                </div>
                
                {customTexts.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-md font-medium">Added Texts:</h4>
                    <ul className="mt-2 space-y-2">
                      {customTexts.map(text => (
                        <li key={text.id} className="flex justify-between items-center p-2 bg-gray-100 rounded-lg">
                          <span 
                            style={{
                              color: text.color,
                              textShadow: `${text.borderWidth} ${text.borderWidth} 0 ${text.borderColor}, 
                                          -${text.borderWidth} ${text.borderWidth} 0 ${text.borderColor}, 
                                          ${text.borderWidth} -${text.borderWidth} 0 ${text.borderColor}, 
                                          -${text.borderWidth} -${text.borderWidth} 0 ${text.borderColor}`
                            }}
                            className={`${text.size} font-bold`}
                          >
                            {text.text}
                          </span>
                          <button
                            onClick={() => removeCustomText(text.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <HiOutlineX className="w-5 h-5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div 
                className={`relative ${previewMode ? 'border-4 border-indigo-500 rounded-lg' : ''}`}
                onMouseMove={activeTextId ? handleDragMove : undefined}
                onMouseUp={activeTextId ? handleDragEnd : undefined}
                onMouseLeave={activeTextId ? handleDragEnd : undefined}
              >
                <img
                  ref={imageRef}
                  src={previewUrl}
                  alt="Preview"
                  className="w-full rounded-lg shadow-lg"
                />
                {previewMode && (
                  <>
                    {caption && (
                      <div 
                        className={`absolute w-full text-center p-4 text-white font-bold
                          ${captionPosition === 'top' ? 'top-0' : 
                            captionPosition === 'bottom' ? 'bottom-0' : 
                            'top-1/2 transform -translate-y-1/2'}`}
                        style={{
                          textShadow: '2px 2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000, -2px -2px 0 #000'
                        }}
                      >
                        <span className="text-xl">{caption}</span>
                      </div>
                    )}
                    
                    {customTexts.map(text => (
                      <div 
                        key={text.id}
                        className="absolute text-center cursor-move"
                        style={{
                          top: `${text.position.y}%`,
                          left: `${text.position.x}%`,
                          transform: 'translate(-50%, -50%)',
                          userSelect: 'none'
                        }}
                        onMouseDown={(e) => handleDragStart(e, text.id)}
                      >
                        <span 
                          style={{
                            color: text.color,
                            textShadow: `${text.borderWidth} ${text.borderWidth} 0 ${text.borderColor}, 
                                        -${text.borderWidth} ${text.borderWidth} 0 ${text.borderColor}, 
                                        ${text.borderWidth} -${text.borderWidth} 0 ${text.borderColor}, 
                                        -${text.borderWidth} -${text.borderWidth} 0 ${text.borderColor}`
                          }}
                          className={`${text.size} font-bold`}
                        >
                          {text.text}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
            
            {!editMode && (
              <div className="absolute top-2 right-2 flex space-x-2">
                <button
                  onClick={() => setEditMode('crop')}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                  title="Crop Image"
                >
                  <HiScissors className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setEditMode('text')}
                  className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600"
                  title="Add Text"
                >
                  <HiPencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setFile(null)}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  title="Remove Image"
                >
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {file && !editMode && (
          <div className="w-full space-y-4">
            <div className="flex items-center space-x-4">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add your meme caption..."
                className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
              <button
                onClick={generateAICaption}
                disabled={isGeneratingCaption}
                className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                <HiLightningBolt className="w-6 h-6" />
              </button>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                {previewMode ? 'Edit Mode' : 'Preview Mode'}
              </button>

              <button
                onClick={handleUpload}
                disabled={isLoading}
                className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 flex items-center space-x-2"
              >
                <HiUpload className="w-5 h-5" />
                <span>{isLoading ? 'Uploading...' : 'Upload Meme'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
