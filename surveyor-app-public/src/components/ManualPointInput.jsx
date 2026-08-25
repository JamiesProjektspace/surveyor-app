import { manualInputLabelsBySystem } from '../utils/coordinates'

export default function ManualPointInput({ coordSystem, inputA, inputB, onChangeA, onChangeB, onAdd }) {
  const labels = manualInputLabelsBySystem[coordSystem]

  return (
    <div className="manual-input">
      <label>
        {labels.labelA}:{' '}
        <input
          type="number"
          step="any"
          placeholder={labels.placeholderA}
          value={inputA}
          onChange={(e) => onChangeA(e.target.value)}
        />
      </label>
      <label>
        {labels.labelB}:{' '}
        <input
          type="number"
          step="any"
          placeholder={labels.placeholderB}
          value={inputB}
          onChange={(e) => onChangeB(e.target.value)}
        />
      </label>
      <button onClick={onAdd}>Tilføj punkt</button>
    </div>
  )
}