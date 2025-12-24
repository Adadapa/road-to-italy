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
      <div className="pisa-tower">
        <img 
          src="/resources/pisa-tower.png" 
          alt="Leaning Tower of Pisa" 
          className="pisa-image"
        />
      </div>
      
      <h1 className="title">Road to Italy</h1>
      
      <div className="boxes-and-characters">
        {people.map((person, index) => (
          <div key={person.name} className="box-with-character">
            <div className="box">
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
            <div className="character-trail-container">
              <div 
                className="road-trail"
                style={{
                  width: `calc(${Math.min((person.kilometers / 100) * 70, 70)}vw)`,
                  '--trail-progress': Math.min(person.kilometers / 100, 1)
                } as React.CSSProperties}
              />
              <div 
                className={`running-character ${index === 0 ? 'girl-character' : 'boy-character'}`}
                style={{
                  left: `calc(${Math.min((person.kilometers / 100) * 70, 70)}vw)`
                } as React.CSSProperties}
              >
              <svg viewBox="0 0 32 48" className="pixel-character">
                {index === 0 ? (
                  <>
                    {/* Girl character */}
                    <defs>
                      <style>{`
                        .girl-hair { fill: #8B4513; }
                        .girl-skin { fill: #FFDBAC; }
                        .girl-dress { fill: #FF1493; }
                        .girl-shoes { fill: #000; }
                      `}</style>
                    </defs>
                    {/* Hair */}
                    <rect x="8" y="4" width="16" height="8" className="girl-hair"/>
                    <rect x="6" y="8" width="20" height="6" className="girl-hair"/>
                    {/* Head */}
                    <rect x="10" y="12" width="12" height="12" className="girl-skin"/>
                    {/* Eyes */}
                    <rect x="12" y="16" width="2" height="2" fill="#000"/>
                    <rect x="18" y="16" width="2" height="2" fill="#000"/>
                    {/* Smile */}
                    <rect x="13" y="20" width="6" height="1" fill="#000"/>
                    {/* Body/Dress */}
                    <rect x="10" y="24" width="12" height="16" className="girl-dress"/>
                    {/* Arms - running position */}
                    <rect x="4" y="26" width="6" height="3" className="girl-skin"/>
                    <rect x="22" y="28" width="6" height="3" className="girl-skin"/>
                    {/* Legs - running position */}
                    <rect x="12" y="40" width="4" height="8" className="girl-skin"/>
                    <rect x="16" y="42" width="4" height="6" className="girl-skin"/>
                    {/* Shoes */}
                    <rect x="11" y="48" width="6" height="2" className="girl-shoes"/>
                    <rect x="15" y="48" width="6" height="2" className="girl-shoes"/>
                  </>
                ) : (
                  <>
                    {/* Boy character */}
                    <defs>
                      <style>{`
                        .boy-hair { fill: #654321; }
                        .boy-skin { fill: #FFDBAC; }
                        .boy-shirt { fill: #1E90FF; }
                        .boy-pants { fill: #000080; }
                        .boy-shoes { fill: #000; }
                      `}</style>
                    </defs>
                    {/* Hair */}
                    <rect x="8" y="4" width="16" height="6" className="boy-hair"/>
                    <rect x="10" y="6" width="12" height="4" className="boy-hair"/>
                    {/* Head */}
                    <rect x="10" y="12" width="12" height="12" className="boy-skin"/>
                    {/* Eyes */}
                    <rect x="12" y="16" width="2" height="2" fill="#000"/>
                    <rect x="18" y="16" width="2" height="2" fill="#000"/>
                    {/* Smile */}
                    <rect x="13" y="20" width="6" height="1" fill="#000"/>
                    {/* Body/Shirt */}
                    <rect x="10" y="24" width="12" height="10" className="boy-shirt"/>
                    {/* Arms - running position */}
                    <rect x="4" y="26" width="6" height="3" className="boy-skin"/>
                    <rect x="22" y="28" width="6" height="3" className="boy-skin"/>
                    {/* Pants */}
                    <rect x="11" y="34" width="10" height="8" className="boy-pants"/>
                    {/* Legs - running position */}
                    <rect x="12" y="42" width="3" height="6" className="boy-skin"/>
                    <rect x="17" y="44" width="3" height="4" className="boy-skin"/>
                    {/* Shoes */}
                    <rect x="11" y="48" width="5" height="2" className="boy-shoes"/>
                    <rect x="16" y="48" width="5" height="2" className="boy-shoes"/>
                  </>
                )}
              </svg>
              </div>
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

