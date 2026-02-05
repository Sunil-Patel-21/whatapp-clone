


export default function formatTimestamp(timestamp) {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const messageTime = new Date(timestamp);
    
    if (isNaN(messageTime.getTime())) return 'Just now';
    
    const diff = now.getTime() - messageTime.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    // For older timestamps, show actual date
    return messageTime.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: messageTime.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}