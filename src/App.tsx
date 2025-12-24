import { useState, useRef, useEffect } from 'react'
import './App.css'
import { supabase } from './supabase'


interface Person {
id: number
  name: string
  kilometers: number
}

function App() {
  const [people, setPeople] = useState<Person[]>([]) // empty start since we load the data from the database
  const [showOverlay, setShowOverlay] = useState(false)
  const [showEditOverlay, setShowEditOverlay] = useState(false)
  const [selectedPersonIndex, setSelectedPersonIndex] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState('')
  const isProcessingRef = useRef(false)
  const isEditProcessingRef = useRef(false)

  useEffect(() => { // load the data from the database
    const loadScores = async () => {
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .order('id')
  
      if (!error && data) {
        setPeople(data)
      }
    }
  
    loadScores()
  }, []) // the dependnecy array is empty so this only runs at the initial render
  
  const handleAddClick = (index: number) => {
    setSelectedPersonIndex(index)
    setShowOverlay(true)
    setInputValue('')
    isProcessingRef.current = false
  }

  const handleOverlayClose = () => {
    setShowOverlay(false)
    setShowEditOverlay(false)
    setSelectedPersonIndex(null)
    setInputValue('')
    isProcessingRef.current = false
    isEditProcessingRef.current = false
  }

  const handleEditClick = (index: number) => {
    setSelectedPersonIndex(index)
    setShowEditOverlay(true)
    setInputValue(people[index].kilometers.toString())
    isEditProcessingRef.current = false
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Prevent double submission
    if (isProcessingRef.current) {
      return
    }
    
    const value = parseFloat(inputValue)
    
    if (!isNaN(value) && value > 0 && selectedPersonIndex !== null) {
      isProcessingRef.current = true
      
      const selectedPerson = people[selectedPersonIndex]
      const newKilometers = Math.round((selectedPerson.kilometers + value) * 100) / 100

      // Update local state optimistically
      setPeople(prev =>
        prev.map((person, i) =>
          i === selectedPersonIndex
            ? {
                ...person,
                kilometers: newKilometers,
              }
            : person
        )
      )

      // Update Supabase table
      const { error } = await supabase
        .from('scores')
        .update({ kilometers: newKilometers })
        .eq('id', selectedPerson.id)

      if (error) {
        console.error('Error updating Supabase:', error)
        // Revert local state on error
        setPeople(prev =>
          prev.map((person, i) =>
            i === selectedPersonIndex
              ? {
                  ...person,
                  kilometers: selectedPerson.kilometers,
                }
              : person
          )
        )
        alert('Failed to update. Please try again.')
        isProcessingRef.current = false
        return
      }
      
      handleOverlayClose()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setInputValue(value)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Prevent double submission
    if (isEditProcessingRef.current) {
      return
    }
    
    const value = parseFloat(inputValue)
    
    if (!isNaN(value) && value >= 0 && selectedPersonIndex !== null) {
      isEditProcessingRef.current = true
      
      const selectedPerson = people[selectedPersonIndex]
      const newKilometers = Math.round(value * 100) / 100

      // Update local state optimistically
      setPeople(prev =>
        prev.map((person, i) =>
          i === selectedPersonIndex
            ? {
                ...person,
                kilometers: newKilometers,
              }
            : person
        )
      )

      // Update Supabase table
      const { error } = await supabase
        .from('scores')
        .update({ kilometers: newKilometers })
        .eq('id', selectedPerson.id)

      if (error) {
        console.error('Error updating Supabase:', error)
        // Revert local state on error
        setPeople(prev =>
          prev.map((person, i) =>
            i === selectedPersonIndex
              ? {
                  ...person,
                  kilometers: selectedPerson.kilometers,
                }
              : person
          )
        )
        alert('Failed to update. Please try again.')
        isEditProcessingRef.current = false
        return
      }
      
      handleOverlayClose()
    }
  }

  return (
    <div className="app">
      <h1 className="title">Road to Italy</h1>
      
      <div className="boxes-container">
        {people.map((person, index) => (
          <div key={person.name} className="box">
            <h2 className="box-title">{person.name}</h2>
            <div className="box-content">
              <button 
                className="edit-button"
                onClick={() => handleEditClick(index)}
                aria-label="Edit kilometers"
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <div className="counter">
                <span className="number">{person.kilometers.toFixed(2)}</span>
                <span className="label">km</span>
              </div>
              <button 
                className="add-button"
                onClick={() => handleAddClick(index)}
                aria-label="Add kilometers"
              >
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {showOverlay && (
        <div className="overlay" onClick={handleOverlayClose}>
          <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="overlay-title">Add more kms</h2>
            <form onSubmit={handleAddSubmit}>
              <input
                type="text"
                className="overlay-input"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Enter kilometers"
                autoFocus
              />
              <button type="submit" className="overlay-submit-button">
                Add
              </button>
            </form>
          </div>
        </div>
      )}

      {showEditOverlay && (
        <div className="overlay" onClick={handleOverlayClose}>
          <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="overlay-title">Edit kilometers</h2>
            <form onSubmit={handleEditSubmit}>
              <input
                type="text"
                className="overlay-input"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Enter new kilometers value"
                autoFocus
              />
              <button type="submit" className="overlay-submit-button">
                Update
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

