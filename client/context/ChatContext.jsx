import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({children}) => {

    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({})

    const {socket, axios} = useContext(AuthContext)

    // function to get all users for sidebar
    const getUsers = async () => {
        try {
            const {data} = await axios.get("/api/messages/users")
            if(data.success) {
                setUsers(data.users)
                setUnseenMessages((prev) => ({...prev, ...data.unseenMessages}))
            }
        } catch(error) {
            toast.error(error.message)
        }
    }

    // function to get all groups for sidebar
    const getGroups = async () => {
        try {
            const {data} = await axios.get("/api/groups")
            if(data.success) {
                setGroups(data.groups)
            }
        } catch(error) {
            toast.error(error.message)
        }
    }

    // function to create group
    const createGroup = async (groupData) => {
        try {
            const {data} = await axios.post("/api/groups", groupData)
            if(data.success) {
                setGroups((prevGroups) => [...prevGroups, data.group])
                toast.success(data.message)
                return data.group
            } else {
                toast.error(data.message)
            }
        } catch(error) {
            toast.error(error.message)
        }
    }

    // function to send message to selected user/group
    const sendMessage = async (messageData) => {
        try {
            const url = selectedUser.isGroup 
                ? `/api/messages/group/send/${selectedUser._id}`
                : `/api/messages/send/${selectedUser._id}`;

            const {data} = await axios.post(url, messageData);
            if(data.success) {
                setMessages((prevMessages) => [...prevMessages, data.newMessage])
            } else {
                toast.error(data.message)
            }
        } catch(error) {
            toast.error(error.message)
        }
    }

    // function to subscribe to messages for selected user or group
    const subscribeToMessages = () => {
        if(!socket) return;
        socket.on("newMessage", async (newMessage)=> {
            if (newMessage.groupId) {
                if (selectedUser && selectedUser.isGroup && newMessage.groupId === selectedUser._id) {
                    setMessages((prevMessages) => [...prevMessages, newMessage]);
                } else {
                    setUnseenMessages((prevUnseenMessages) => ({
                        ...prevUnseenMessages, [newMessage.groupId] : prevUnseenMessages[newMessage.groupId] ? prevUnseenMessages[newMessage.groupId]+1: 1
                    }))
                }
            } else {
                if(selectedUser && !selectedUser.isGroup && newMessage.senderId === selectedUser._id) {
                    newMessage.seen = true;
                    setMessages((prevMessages)=> [...prevMessages, newMessage])
                    try {
                        await axios.put(`/api/messages/mark/${newMessage._id}`)
                    }
                    catch (error) {
                        console.log(error)
                    }
                } else {
                    setUnseenMessages((prevUnseenMessages) => ({
                        ...prevUnseenMessages, [newMessage.senderId] : prevUnseenMessages[newMessage.senderId] ? prevUnseenMessages[newMessage.senderId]+1: 1
                    }))
                }
            }
        })
    }

    // function to unsubscribe from messages
    const unsubscribeFromMessages = () => {
        if(socket) socket.off("newMessage");
    }

    useEffect(() => {
        subscribeToMessages()
        return () => unsubscribeFromMessages();
    }, [socket, selectedUser])

    // function to get messages for selected user/group
    const getMessages = async(id, isGroup = false) => {
        try {
            const url = isGroup ? `/api/messages/group/${id}` : `/api/messages/${id}`;
            const {data} = await axios.get(url);
            if(data.success) {
                setMessages(data.messages)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Join group socket rooms whenever socket or groups change
    useEffect(() => {
        if (socket && groups.length > 0) {
            const groupIds = groups.map(g => g._id);
            socket.emit("joinGroupRooms", groupIds);
        }
    }, [socket, groups]);

    // function to update group details 
    const updateGroup = async (groupId, updateData) => {
        try {
            const {data} = await axios.put(`/api/groups/${groupId}`, updateData)
            if(data.success) {

                setGroups(prevGroups =>
                    prevGroups.map(g =>
                        g._id === groupId ? data.group : g
                    )
                );  
                
                setSelectedUser(prev =>
                    prev?._id === groupId ? { ...data.group, isGroup: true } : prev
                );

                toast.success(data.message)
                return data.group
            } else {
                toast.error(data.message)
            }
        } catch(error) {
            toast.error(error.message)
        }
    }

    const value = {
        messages, users, groups, selectedUser, getMessages, getUsers, getGroups, createGroup, sendMessage, setSelectedUser, setUnseenMessages, unseenMessages,
        updateGroup
    }

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}