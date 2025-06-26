import React, { useState, useRef } from 'react';

// Cloudinary upload function
const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'Profile'); // Cloudinary unsigned preset

  const response = await fetch(
    'https://api.cloudinary.com/v1_1/delmonys3/image/upload', // <-- Cloudinary cloud name set
    {
      method: 'POST',
      body: formData,
    }
  );
  if (!response.ok) throw new Error('Upload failed');
  const data = await response.json();
  return data.secure_url;
};

const StudentImageUpload = ({ studentId, onImageUpdate, currentImage }) => {
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hovered, setHovered] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Upload to Cloudinary
      const imageUrl = await uploadToCloudinary(file);
      onImageUpdate({
        originalUrl: imageUrl,
        optimizedUrl: imageUrl,
        fileName: file.name
      });
      setUploading(false);
      setProgress(100);
    } catch (error) {
      setUploading(false);
      setProgress(0);
      setImagePreview(null);
      alert('Failed to upload image. Please try again.');
      console.error('Error uploading image:', error);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Determine which image to show
  const displayImage = imagePreview || currentImage || null;

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 16 }}>
      <div
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: 120,
          height: 120,
          border: hovered ? '2px solid #888' : '2px solid #e0e0e0',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: displayImage ? `url(${displayImage}) center/cover` : 'transparent',
          position: 'relative',
          overflow: 'hidden',
          transition: 'border 0.2s',
        }}
      >
        {!displayImage && (
          <div style={{ textAlign: 'center', color: '#666' }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>📷</div>
            <div style={{ fontSize: 12 }}>Upload Photo</div>
          </div>
        )}
        {(hovered && !uploading && displayImage) && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 15,
            fontWeight: 400,
            letterSpacing: 0.5,
            zIndex: 2,
            pointerEvents: 'none',
            borderRadius: '50%',
            fontFamily: 'inherit',
            textShadow: '0 1px 4px rgba(0,0,0,0.18)',
          }}>
            <div style={{ fontSize: 15, fontWeight: 500, padding: '2px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.18)' }}>Change</div>
          </div>
        )}
        {uploading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 12,
            flexDirection: 'column',
            zIndex: 3,
            borderRadius: '50%',
          }}>
            <div>Uploading...</div>
            <div style={{ marginTop: 8, width: '80%' }}>
              <div style={{
                height: 6,
                background: '#fff',
                borderRadius: 3,
                overflow: 'hidden',
                width: '100%'
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: '#4caf50',
                  transition: 'width 0.2s'
                }} />
              </div>
              <div style={{ fontSize: 10, marginTop: 2 }}>{progress}%</div>
            </div>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default StudentImageUpload; 