import React, { useState, useEffect } from 'react'

const ChatGpt: React.FC = () => {
  const [inputText, setInputText] = useState('')
  const [model, setModel] = useState('gpt2')
  const [responseText, setResponseText] = useState('')

  const handleInputTextChange = (event) => {
    setInputText(event.target.value)
  }

  const handleModelChange = (event) => {
    setModel(event.target.value)
  }

  const handleChatGPTSubmit = async (event) => {
    event.preventDefault()

    const url = 'http://localhost:5000/chat-gpt'
    const params = {
      text: inputText,
      model
    }

    try {
      const response = await axios.post(url, params)

      setResponseText(response.data.text)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div>
      <form onSubmit={handleChatGPTSubmit}>
        <label>
          Input text:
          <input type="text" value={inputText} onChange={handleInputTextChange} />
        </label>

        <br />

        <label>
          Model:
          <select value={model} onChange={handleModelChange}>
            <option value="gpt2">GPT-2</option>
            <option value="davinci">Davinci</option>
          </select>
        </label>

        <br />
        <button type="submit">Submit</button>
      </form>

      <div>
        {responseText}
      </div>
    </div>
  )
}

export default ChatGpt
