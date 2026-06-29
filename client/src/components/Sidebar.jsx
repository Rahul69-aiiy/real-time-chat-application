import React, { useContext, useEffect, useState } from "react";
import assets from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "../../context/ChatContext.jsx";
import toast from "react-hot-toast";

function Sidebar() {
  const {
    getUsers,
    users,
    getGroups,
    groups,
    createGroup,
    selectedUser,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
  } = useContext(ChatContext);

  const { logout, onlineUsers } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState("chats"); // "chats" or "groups"
  const [input, setInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupPicPreview, setGroupPicPreview] = useState("");
  const [groupPicBase64, setGroupPicBase64] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const filteredUsers = input
    ? users.filter((user) => user.fullName.toLowerCase().includes(input.toLowerCase()))
    : users;

  const filteredGroups = input
    ? groups.filter((group) => group.name.toLowerCase().includes(input.toLowerCase()))
    : groups;

  const navigate = useNavigate();

  useEffect(() => {
    getUsers();
    getGroups();
  }, [onlineUsers]);

  const handleToggleMember = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers((prev) => prev.filter((id) => id !== userId));
    } else {
      setSelectedMembers((prev) => [...prev, userId]);
    }
  };

  const handleGroupPicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setGroupPicPreview(reader.result);
      setGroupPicBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }
    if (selectedMembers.length === 0) {
      toast.error("Please select at least one member to join");
      return;
    }
    const created = await createGroup({
      name: groupName.trim(),
      members: selectedMembers,
      description: groupDesc.trim() || "Group Chat",
      profilePic: groupPicBase64,
    });
    if (created) {
      setGroupName("");
      setGroupDesc("");
      setSelectedMembers([]);
      setGroupPicPreview("");
      setGroupPicBase64("");
      setShowModal(false);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[#161229] ${selectedUser ? "max-md:hidden" : ""}`}>
      <div className="pb-3 border-b border-gray-700/50">
        <div className="mx-6 my-3">
          <div className="flex justify-between items-center">
            <img
              src={assets.logo}
              alt="logo"
              className="max-h-6 cursor-pointer"
            />
            <div className="relative py-2">
              <img
                onClick={() => setIsMenuOpen((prev) => !prev)}
                src={assets.menu_icon}
                alt="Menu"
                className="max-h-5 cursor-pointer"
              />
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>
                  <div className="absolute top-full right-0 z-20 w-32 p-5 rounded-md bg-[#282142] border border-gray-600 text-gray-100">
                    <p onClick={() => { navigate("/profile"); setIsMenuOpen(false); }} className="cursor-pointer text-sm hover:text-purple-400 transition-colors">Edit Profile</p>
                    <hr className="my-2 border-t border-gray-500" />
                    <p onClick={() => { logout(); setIsMenuOpen(false); }} className="cursor-pointer text-sm hover:text-purple-400 transition-colors">Logout</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mx-4 my-2 p-1 bg-[#282142] rounded-lg">
          <button
            onClick={() => {
              setActiveTab("chats");
              setInput("");
            }}
            className={`flex-1 py-1.5 text-sm rounded-md transition-all cursor-pointer ${
              activeTab === "chats"
                ? "bg-gradient-to-r from-purple-400 to-violet-600 text-white shadow-md font-medium"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Chats
          </button>
          <button
            onClick={() => {
              setActiveTab("groups");
              setInput("");
            }}
            className={`flex-1 py-1.5 text-sm rounded-md transition-all cursor-pointer ${
              activeTab === "groups"
                ? "bg-gradient-to-r from-purple-400 to-violet-600 text-white shadow-md font-medium"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Groups
          </button>
        </div>

        {/* Search */}
        <div className="bg-[#282142] rounded-full flex items-center gap-2 py-2 px-4 mt-2 mx-4">
          <img src={assets.search_icon} alt="search" className="w-3" />
          <input
            onChange={(e) => setInput(e.target.value)}
            value={input}
            type="text"
            className="bg-transparent border-none outline-none text-white text-s placeholder-[#c8c8c8] flex-1"
            placeholder={activeTab === "chats" ? "Search User..." : "Search Group..."}
          />
        </div>
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "chats" ? (
          <div className="flex flex-col">
            {filteredUsers.map((user, index) => (
              <div
                onClick={() => {
                  setSelectedUser(user);
                  setUnseenMessages((prev) => ({ ...prev, [user._id]: 0 }));
                }}
                key={index}
                className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm ${
                  selectedUser?._id === user._id && !selectedUser?.isGroup && "bg-[#282142]/50"
                }`}
              >
                <img
                  src={user?.profilePic || assets.avatar_icon}
                  alt=""
                  className="w-[35px] aspect-[1/1] rounded-full object-cover"
                />
                <div className="flex flex-col leading-5">
                  <p className="text-white font-medium">{user.fullName}</p>
                  {onlineUsers.includes(user._id) ? (
                    <span className="text-green-400 text-xs">Online</span>
                  ) : (
                    <span className="text-neutral-400 text-xs">Offline</span>
                  )}
                </div>
                {unseenMessages[user._id] > 0 && (
                  <p className="absolute top-4 right-4 text-xs text-white h-5 w-5 flex justify-center items-center rounded-full bg-violet-500/50">
                    {unseenMessages[user._id]}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredGroups.map((group, index) => (
              <div
                onClick={() => {
                  setSelectedUser({ ...group, isGroup: true });
                  setUnseenMessages((prev) => ({ ...prev, [group._id]: 0 }));
                }}
                key={index}
                className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm ${
                  selectedUser?._id === group._id && selectedUser?.isGroup && "bg-[#282142]/50"
                }`}
              >
                {group.profilePic ? (
                  <img
                    src={group.profilePic}
                    alt=""
                    className="w-[35px] h-[35px] rounded-full object-cover"
                  />
                ) : (
                  <div className="w-[35px] h-[35px] rounded-full bg-gradient-to-tr from-purple-400 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                    {group.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col leading-5">
                  <p className="text-white font-medium">{group.name}</p>
                  <span className="text-neutral-400 text-xs">{group.members.length} members</span>
                </div>
                {unseenMessages[group._id] > 0 && (
                  <p className="absolute top-4 right-4 text-xs text-white h-5 w-5 flex justify-center items-center rounded-full bg-violet-500/50">
                    {unseenMessages[group._id]}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {activeTab === "groups" && (
        <div className="p-4 border-t border-gray-700/50 bg-[#161229] flex justify-center">
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-400 to-violet-600 text-white text-sm font-semibold hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>+ Create Group</span>
          </button>
        </div>
      )}

      {/* Create Group Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#1e1b36] border border-gray-700 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-center text-purple-300">Create Group Chat</h2>
            <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
              <div className="flex flex-col items-center gap-2 mb-2">
                <div className="relative group">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-400 to-violet-600 flex items-center justify-center text-white font-bold text-xl overflow-hidden">
                    {groupPicPreview ? (
                      <img src={groupPicPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      "G"
                    )}
                  </div>
                  <label htmlFor="group-pic-input" className="absolute bottom-0 right-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center border border-white cursor-pointer hover:bg-purple-700 transition-colors">
                    <span className="text-xs text-white leading-none font-bold">+</span>
                  </label>
                  <input
                    id="group-pic-input"
                    type="file"
                    accept="image/*"
                    onChange={handleGroupPicChange}
                    className="hidden"
                  />
                </div>
                <span className="text-[10px] text-gray-400 font-semibold">Set Group Picture</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="w-full bg-[#282142] border border-gray-600 rounded-lg py-2 px-3 text-white placeholder-gray-400 outline-none focus:border-purple-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="e.g. Project discussion, Study group"
                  className="w-full bg-[#282142] border border-gray-600 rounded-lg py-2 px-3 text-white placeholder-gray-400 outline-none focus:border-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">Select Members</label>
                <div className="max-h-[160px] overflow-y-auto space-y-1 bg-[#282142]/40 rounded-lg p-2 border border-gray-700">
                  {users.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => handleToggleMember(user._id)}
                      className="flex items-center justify-between p-2 rounded hover:bg-[#282142]/80 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={user.profilePic || assets.avatar_icon}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="text-sm font-light">{user.fullName}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(user._id)}
                        onChange={() => {}} // toggled by parent div click
                        className="w-4 h-4 rounded text-purple-600 border-gray-600 focus:ring-purple-500 bg-[#282142] cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setGroupName("");
                    setGroupDesc("");
                    setSelectedMembers([]);
                    setGroupPicPreview("");
                    setGroupPicBase64("");
                  }}
                  className="px-4 py-2 bg-gray-600/50 hover:bg-gray-600 text-gray-200 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-purple-400 to-violet-600 text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
