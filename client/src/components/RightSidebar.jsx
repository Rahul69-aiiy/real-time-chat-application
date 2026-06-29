import React, { useContext, useEffect, useState } from 'react'
import assets from '../assets/assets'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import toast from 'react-hot-toast'

function RightSidebar() {

  const {selectedUser, messages, users, updateGroup} = useContext(ChatContext)
  const {logout, onlineUsers, authUser} = useContext(AuthContext)
  const [msgImages, setMsgImages] = useState([])
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editData, setEditData] = useState({ name: '', description: '' });

  useEffect(() => {
    if (selectedUser?.isGroup) {
      setEditData({ name: selectedUser.name, description: selectedUser.description || '' });
    }
  }, [selectedUser]);

  const handleSaveGroupInfo = async () => {
    if (editData.name.trim() === '') return toast.error("Group name cannot be empty");
    await updateGroup(selectedUser._id, editData);
    setIsEditingInfo(false);
  };

  // Get all the images from the messages and set them to state
  useEffect(()=>{
    setMsgImages(
      messages.filter(msg=> msg.image).map(msg=> msg.image)
    )
  }, [messages])

  const handleUpdateGroupPic = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      await updateGroup(selectedUser._id, { profilePic: reader.result });
    };
    reader.readAsDataURL(file);
  };

  return selectedUser && (
    <div className={`bg-[#8185B2]/10 text-white w-full relative overflow-y-scroll ${selectedUser ? "max-md:hidden" : ""}`}>
      <div className="pt-16 flex flex-col items-center gap-2 text-xs font-light mx-auto">
        {selectedUser.isGroup ? (
          <div className="relative group/avatar cursor-pointer">
            {selectedUser.profilePic ? (
              <img src={selectedUser.profilePic} alt="" className='w-20 h-20 rounded-full object-cover shadow-lg mb-2 border-2 border-purple-400' />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-400 to-violet-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-2">
                {selectedUser.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            {/* Edit overlay */}
            <label htmlFor="group-edit-pic" className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </label>
            <input type="file" id="group-edit-pic" accept="image/png, image/jpeg" className="hidden" onChange={handleUpdateGroupPic} />
          </div>
        ) : (
          <img src={selectedUser?.profilePic || assets.avatar_icon} alt="" className='w-20 aspect-[1/1] rounded-full object-cover mb-2' />
        )}
        
        {selectedUser.isGroup ? (
          isEditingInfo ? (
            <div className="flex flex-col gap-2 px-10 w-full mt-2 items-center">
              <input type="text" value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} className="bg-[#282142]/80 border border-white/20 rounded px-2 py-1.5 text-center text-sm w-full outline-none focus:border-purple-400" placeholder="Group Name" />
              <textarea value={editData.description} onChange={(e) => setEditData({...editData, description: e.target.value})} className="bg-[#282142]/80 border border-white/20 rounded px-2 py-1.5 text-center text-xs w-full resize-none outline-none focus:border-purple-400" rows="2" placeholder="Description" />
              <div className="flex gap-2 justify-center w-full mt-1">
                <button onClick={handleSaveGroupInfo} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-1 rounded text-xs transition-colors">Save</button>
                <button onClick={() => setIsEditingInfo(false)} className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-1 rounded text-xs transition-colors">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <h1 className='px-10 text-xl font-medium mx-auto flex items-center justify-center gap-2 text-center group/name w-full relative cursor-pointer' onClick={() => setIsEditingInfo(true)} title="Click to edit">
                {selectedUser.name}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400 opacity-0 group-hover/name:opacity-100 transition-opacity absolute right-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                </svg>
              </h1>
              <p className='px-10 mx-auto text-center text-neutral-400 mt-1 cursor-pointer hover:text-gray-300 transition-colors' onClick={() => setIsEditingInfo(true)} title="Click to edit">
                {selectedUser.description || "No description"}
              </p>
            </>
          )
        ) : (
          <>
            <h1 className='px-10 text-xl font-medium mx-auto flex items-center gap-2 text-center'>
              {onlineUsers.includes(selectedUser._id) && <p className='w-2 h-2 rounded-full bg-green-500'></p>}
              {selectedUser.fullName}
            </h1>
            <p className='px-10 mx-auto text-center text-neutral-400 mt-1'>
              {selectedUser.bio}
            </p>
          </>
        )}
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