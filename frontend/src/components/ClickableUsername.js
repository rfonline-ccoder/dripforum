import React, { useState } from 'react';
import UserProfile from './UserProfile';

const ClickableUsername = ({ userId, username, user, currentUser, onUpdate, className = "" }) => {
  const [showProfile, setShowProfile] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowProfile(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`text-blue-400 hover:text-blue-300 hover:underline cursor-pointer ${className}`}
      >
        {username}
      </button>
      
      {showProfile && (
        <UserProfile
          userId={userId}
          currentUser={currentUser}
          onClose={() => setShowProfile(false)}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
};

export default ClickableUsername;
