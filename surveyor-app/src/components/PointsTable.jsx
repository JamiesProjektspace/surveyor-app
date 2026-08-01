import { toDisplayCoords } from '../utils/coordinates'

export default function PointsTable({ points, coordSystem, onRemove }) {
  return (
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>{coordSystem === 'wgs84' ? 'Breddegrad' : 'Øst (m)'}</th>
          <th>{coordSystem === 'wgs84' ? 'Længdegrad' : 'Nord (m)'}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {points.map((p, i) => {
          const { a, b } = toDisplayCoords(p, coordSystem)
          return (
            <tr key={i}>
              <td>P{i + 1}</td>
              <td>{a}</td>
              <td>{b}</td>
              <td>
                <button onClick={() => onRemove(i)}>Fjern</button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}