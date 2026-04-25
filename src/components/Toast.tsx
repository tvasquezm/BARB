import React, { useEffect, useState } from 'react'

export const showToast = (msg: string, ms = 3500) => {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg, ms } }))
}

const Toast: React.FC = () => {
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false })

  useEffect(() => {
    const handler = (e: any) => {
      setToast({ msg: e.detail.msg, show: true })
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), e.detail.ms)
    }
    window.addEventListener('show-toast', handler)
    return () => window.removeEventListener('show-toast', handler)
  }, [])

  return (
    <div id="toast" className={toast.show ? 'show' : ''}>
      {toast.msg}
    </div>
  )
}
export default Toast