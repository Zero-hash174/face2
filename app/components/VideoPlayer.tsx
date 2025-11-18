'use-client'
import React, { useEffect, useRef } from 'react'

// نحن نستخدم الكود الأخير من المحاولة السابقة
export default function VideoPlayer({ localStream, remoteVideoRef }: { 
  localStream: MediaStream | null, 
  remoteVideoRef: React.RefObject<HTMLVideoElement | null> 
}){
  const localRef = useRef<HTMLVideoElement | null>(null)

  // 1. البث المحلي
  useEffect(()=>{
    if(localRef.current){
      localRef.current.srcObject = localStream ?? null
    }
  },[localStream])

  return (
    <div className="flex gap-4">
      <div>
        <p>أنت</p>
        
        {/* 🟢 2. استخدام الكلاس الجديد 🟢 */}
        <video 
          ref={localRef} 
          autoPlay 
          muted 
          playsInline 
          className="video-player" 
        />
        
      </div>
      <div>
        <p>الطرف الآخر</p>
        
        {/* 🟢 2. استخدام الكلاس الجديد 🟢 */}
        <video 
          ref={remoteVideoRef} 
          autoPlay 
          muted 
          playsInline 
          className="video-player" 
        />
        
      </div>
    </div>
  )
}