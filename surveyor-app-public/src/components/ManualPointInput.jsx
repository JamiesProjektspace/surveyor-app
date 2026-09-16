import { useState } from 'react'
import { manualInputLabelsBySystem } from '../utils/coordinates'

// inputA/inputB holdes som lokal state her i stedet for i App — det betyder at et
// tastetryk i disse felter ikke længere trigger et re-render af hele App (og dermed
// hele kortet med alle markører/skellinjer), kun af denne lille komponent.
// onAdd(a, b) skal returnere true, hvis punktet blev tilføjet (så felterne kan tømmes),
// eller false/undefined ved ugyldigt input (så brugeren kan rette det uden at miste det).
export default function ManualPointInput({ coordSystem, onAdd }) {
  const [inputA, setInputA] = useState('')
  const [inputB, setInputB] = useState('')
  const labels = manualInputLabelsBySystem[coordSystem]

  const handleAdd = () => {
    const wasAdded = onAdd(inputA, inputB)
    if (wasAdded) {
      setInputA('')
      setInputB('')
    }
  }

  return (
    <div className="manual-input">
      <label>
        {labels.labelA}:{' '}
        <input
          type="number"
          step="any"
          placeholder={labels.placeholderA}
          value={inputA}
          onChange={(e) => setInputA(e.target.value)}
        />
      </label>
      <label>
        {labels.labelB}:{' '}
        <input
          type="number"
          step="any"
          placeholder={labels.placeholderB}
          value={inputB}
          onChange={(e) => setInputB(e.target.value)}
        />
      </label>
      <button onClick={handleAdd}>Tilføj punkt</button>
    </div>
  )
}