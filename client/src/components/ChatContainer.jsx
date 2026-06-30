import React, { useContext, useEffect, useRef, useState } from 'react'
import assets from '../assets/assets'
import { formatMessageTime } from '../lib/utils';
import { ChatContext } from '../../context/ChatContext';
import { CallContext } from '../../context/CallContext';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

function ChatContainer() {

  const {messages, users, selectedUser, setSelectedUser, sendMessage, getMessages} = useContext(ChatContext)
  const { initiateCall, joinGroupCall } = useContext(CallContext)
  const scrollEnd = useRef();

  const {authUser, onlineUsers} = useContext(AuthContext)

  useEffect(() => {
    if(selectedUser) {
      getMessages(selectedUser._id, selectedUser.isGroup)
    }
  }, [selectedUser])

  useEffect(() => {
    if(scrollEnd.current && messages) {
      scrollEnd.current.scrollIntoView({behavior: "smooth"})
    }
  }, [messages])

  const [input, setInput] = useState('')

  // Handle sending a message
  const handleSendMessage = async(e) => {
    e.preventDefault();
    if(input.trim() === "") return null;
    await sendMessage({text:input.trim()})
    setInput("")
  } 

  // Handle sending an image
  const handleSendImage = async(e) => {
    const file = e.target.files[0];
    if(!file || !file.type.startsWith("image/")) {
      toast.error("select an image file")
      e.target.value = "";
      return;
    }

    const reader = new FileReader()

    // defining callback on reader
    reader.onloadend = async () => {
      await sendMessage({image: reader.result})
      e.target.value = ""
    }
    reader.readAsDataURL(file)
  }

  // Handle initiating video call
  const handleStartCall = () => {
    if (selectedUser.isGroup) {
      const groupRoomId = `group-${selectedUser._id}`;
      sendMessage({ text: `Video Call started. Click here to join call.` });
      joinGroupCall(groupRoomId, selectedUser.name);
    } else {
      if (!onlineUsers.includes(selectedUser._id)) {
        toast.error(`${selectedUser.fullName} is offline`);
        return;
      }
      sendMessage({ text: `Video Call started.` });
      initiateCall(selectedUser);
    }
  }

  // Helper to find sender profile pic
  const getSenderProfilePic = (senderId) => {
    if (senderId === authUser._id) return authUser.profilePic || assets.avatar_icon;
    
    if (selectedUser?.isGroup) {
      const member = selectedUser.members.find(m => m._id === senderId || m === senderId);
      if (member && typeof member === 'object') {
        return member.profilePic || assets.avatar_icon;
      }
    }
    
    const user = users.find(u => u._id === senderId);
    return user?.profilePic || assets.avatar_icon;
  };

  // Helper to find sender name
  const getSenderName = (senderId) => {
    if (senderId === authUser._id) return "You";
    
    if (selectedUser?.isGroup) {
      const member = selectedUser.members.find(m => m._id === senderId || m === senderId);
      if (member && typeof member === 'object') {
        return member.fullName;
      }
    }
    
    const user = users.find(u => u._id === senderId);
    return user?.fullName || "Group Member";
  };
  
  return selectedUser ?  (
    <div className='h-full overflow-scroll relative backdrop-blur-lg'>
      {/* header  */}
      <div className="flex items-center gap-3 py-3 mx-4 border-b border-stone-500">
          {selectedUser.isGroup ? (
            selectedUser.profilePic ? (
              <img src={selectedUser.profilePic} alt="" className='w-8 h-8 rounded-full object-cover'/>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-400 to-violet-600 flex items-center justify-center text-white font-bold text-xs">
                {selectedUser.name.substring(0, 2).toUpperCase()}
              </div>
            )
          ) : (
            <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className='w-8 h-8 rounded-full object-cover'/>
          )}
          
          <div className="flex-1 text-lg text-white flex flex-col justify-center">
            <div className="flex items-center gap-2 leading-none font-medium text-base">
              {selectedUser.isGroup ? selectedUser.name : selectedUser.fullName}
              {!selectedUser.isGroup && onlineUsers.includes(selectedUser._id) && <span className='w-2 h-2 rounded-full bg-green-500 inline-block'></span>}
            </div>
            <span className="text-xs text-neutral-400">
              {selectedUser.isGroup ? `${selectedUser.members.length} members` : (onlineUsers.includes(selectedUser._id) ? "Online" : "Offline")}
            </span>
          </div>

          {/* Video Call button */}
          <button
            onClick={handleStartCall}
            className="p-2 text-purple-300 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer mr-1"
            title="Start Video Call"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </button>

          <img onClick={()=> setSelectedUser(null)} src={assets.arrow_icon} alt="" className='md:hidden max-w-7 cursor-pointer'/>
          <img src={assets.help_icon} alt="" className='max-md:hidden max-w-5'/>
      </div>
      {/* chat area  */}
      <div className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 justify-end ${msg.senderId !== authUser._id && 'flex-row-reverse'}`}>
            {msg.image ? (
              <div className="flex flex-col">
                {selectedUser.isGroup && msg.senderId !== authUser._id && (
                  <span className="text-[10px] text-purple-300 ml-1 mb-0.5">{getSenderName(msg.senderId)}</span>
                )}
                <img src={msg.image} alt="" className='max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8'/>
              </div>
            ) : (
              <div className="flex flex-col">
                {selectedUser.isGroup && msg.senderId !== authUser._id && (
                  <span className="text-[10px] text-purple-300 ml-1 mb-0.5">{getSenderName(msg.senderId)}</span>
                )}
                {msg.text && (msg.text.startsWith("Video Call started")) ? (
                  <div className="p-3 bg-violet-500/30 border border-violet-500/30 rounded-xl mb-8 flex flex-col gap-2 max-w-[220px]">
                    <div className="flex items-center gap-2 text-purple-300">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      <span className="text-xs font-semibold">{selectedUser.isGroup ? "Group Video Call" : "Video Call Log"}</span>
                    </div>
                    {selectedUser.isGroup && (
                      <button
                        onClick={() => joinGroupCall(`group-${selectedUser._id}`, selectedUser.name)}
                        className="py-1 px-3 bg-gradient-to-r from-purple-400 to-violet-600 hover:brightness-110 active:scale-95 transition-all text-white text-xs font-bold rounded-lg cursor-pointer shadow"
                      >
                        Join Call
                      </button>
                    )}
                  </div>
                ) : (
                  <p className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${msg.senderId === authUser._id ? 'rounded-br-none' : 'rounded-bl-none'}`}>{msg.text}</p>
                )}
              </div>
            )}
            <div className="text-center text-xs">
              <img src={getSenderProfilePic(msg.senderId)} alt="" className='w-7 h-7 rounded-full object-cover mx-auto' />
              <p className='text-gray-500'>{formatMessageTime(msg.createdAt)}</p>
            </div>
          </div>
        ))}
        <div ref={scrollEnd}></div>
      </div>
      {/* bottom area  */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3">
          <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
            <input onChange={(e) => setInput(e.target.value)} value={input} onKeyDown={(e)=> e.key==="Enter"? handleSendMessage(e) : null}
            type="text" placeholder='Send a message' className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400' />
            <input onChange={handleSendImage} type="file" id='image' accept='image/png, image/jpeg' hidden />
            <label htmlFor="image">
              <img src={assets.gallery_icon} alt="" className='w-5 mr-2 cursor-pointer' />
            </label>
          </div>
          <img onClick={handleSendMessage} src={assets.send_button} alt="" className='w-7 cursor-pointer'/>
        </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
      <img src={assets.logo_icon} className='max-w-16' alt="" />
      <p className='text-lg font-medium text-white'>Chat anytime, anywhere</p>
    </div>
  )
}

export default ChatContainer