import React, { useContext, useEffect, useState } from 'react'
import assets from '../assets/assets'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'

function RightSidebar() {

  const {selectedUser, messages, users} = useContext(ChatContext)
  const {logout, onlineUsers, authUser} = useContext(AuthContext)
  const [msgImages, setMsgImages] = useState([])

  // Get all the images from the messages and set them to state
  useEffect(()=>{
    setMsgImages(
      messages.filter(msg=> msg.image).map(msg=> msg.image)
    )
  }, [messages])

  return selectedUser && (
    <div className={`bg-[#8185B2]/10 text-white w-full relative overflow-y-scroll ${selectedUser ? "max-md:hidden" : ""}`}>
      <div className="pt-16 flex flex-col items-center gap-2 text-xs font-light mx-auto">
        {selectedUser.isGroup ? (
          selectedUser.profilePic ? (
            <img src={selectedUser.profilePic} alt="" className='w-20 h-20 rounded-full object-cover shadow-lg mb-2' />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-violet-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-2">
              {selectedUser.name.substring(0, 2).toUpperCase()}
            </div>
          )
        ) : (
          <img src={selectedUser?.profilePic || assets.avatar_icon} alt="" className='w-20 aspect-[1/1] rounded-full object-cover mb-2' />
        )}
        
        <h1 className='px-10 text-xl font-medium mx-auto flex items-center gap-2 text-center'>
          {!selectedUser.isGroup && onlineUsers.includes(selectedUser._id) &&
          <p className='w-2 h-2 rounded-full bg-green-500'></p>}
          {selectedUser.isGroup ? selectedUser.name : selectedUser.fullName}
        </h1>
        <p className='px-10 mx-auto text-center text-neutral-400'>
          {selectedUser.isGroup ? selectedUser.description : selectedUser.bio}
        </p>
      </div>

      <hr className='border-[#ffffff30] my-4'/>

      {/* Group Members List */}
      {selectedUser.isGroup && (
        <div className="px-5 text-xs mb-4">
          <p className="text-gray-300 mb-2 font-medium">Members ({selectedUser.members.length})</p>
          <div className="max-h-[150px] overflow-y-auto space-y-2 bg-[#282142]/30 rounded-lg p-2.5 border border-white/5">
            {selectedUser.members.map((member, index) => {
              const memberObj = typeof member === 'object' ? member : (member === authUser._id ? authUser : users.find(u => u._id === member));
              if (!memberObj) return null;
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={memberObj.profilePic || assets.avatar_icon} alt="" className="w-6 h-6 rounded-full object-cover"/>
                    <span className="truncate max-w-[120px]">{memberObj.fullName} {memberObj._id === authUser._id && "(You)"}</span>
                  </div>
                  {onlineUsers.includes(memberObj._id) ? (
                    <span className="text-[10px] text-green-400">online</span>
                  ) : (
                    <span className="text-[10px] text-neutral-400">offline</span>
                  )}
                </div>
              );
            })}
          </div>
          <hr className='border-[#ffffff30] my-4'/>
        </div>
      )}

      <div className="px-5 text-xs pb-24">
        <p className="text-gray-300 font-medium">Shared Media</p>
        {msgImages.length === 0 ? (
          <p className="text-neutral-500 mt-2 italic">No media shared yet</p>
        ) : (
          <div className="mt-2 max-h-[200px] overflow-y-scroll grid grid-cols-2 gap-4 opacity-80">
            {msgImages.map((url, index)=>(
              <div key={index} onClick={() => window.open(url)} className="cursor-pointer rounded">
                <img src={url} alt="" className='h-full rounded-md object-cover' />
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => logout()} className='absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-400 to-violet-600 text-white border-none text-sm font-light py-2 px-20 rounded-full cursor-pointer shadow-lg hover:brightness-110 transition-all'>
          Logout
      </button>
    </div>
  )
}

export default RightSidebar