'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function Chat() {
  const [user, setUser] = useState<{ username: string } | null>(null)
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState('')
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (!storedUser) {
      router.push('/')
    } else {
      setUser(JSON.parse(storedUser))
    }
  }, [router])

  useEffect(() => {
    // Establish WebSocket connection
    ws.current = new WebSocket('wss://backend-ch-26sz.onrender.com') // Adjust WebSocket URL as needed
  
    ws.current.onopen = () => {
      console.log('WebSocket connected')
    }
  
    ws.current.onmessage = (event) => {
      // Check if the message is a Blob
      if (event.data instanceof Blob) {
        const reader = new FileReader()
        reader.onload = () => {
          const message = reader.result as string
          setMessages((prevMessages) => [
            ...prevMessages,
            { role: 'server', content: message },
          ])
        }
        reader.readAsText(event.data) // Convert Blob to string
      } else {
        // If it's a string, just add it directly
        const message = event.data
        setMessages((prevMessages) => [
          ...prevMessages,
          { role: 'server', content: message },
        ])
      }
    }
  
    return () => {
      ws.current?.close()
    }
  }, [])
  

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (!input) return

    // Add user message to the chat
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: 'user', content: input },
    ])

    // Send the user message to the server (WebSocket)
    if (ws.current) {
      ws.current.send(input)
    }

    setInput('') // Clear input field
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value)
  }

  if (!user) return null

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-blue-500 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Chat with Server</h1>
        <div>
          <span className="mr-4">Welcome, {user.username}</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Logout
          </button>
        </div>
      </header>
      <div className="flex-grow overflow-auto p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${
              message.role === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <span
              className={`inline-block p-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-300 text-black'
              }`}
            >
              {message.content}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex">
          <input
            className="flex-grow mr-2 p-2 border rounded"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
