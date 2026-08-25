import { toDisplayCoords } from '../utils/coordinates'

export default function PointsTable({ points, coordSystem, onRemove }) {
  return (
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>{coordSystem === 'wgs84' ? 'Breddegrad' : 'Øst (m)'}</th>
          <th>{coordSystem === 'wgs84' ? 'Længdegrad' : 'Nord (m)'}</th>
          <th>Kilde</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {points.map((p, i) => {
          const { a, b } = toDisplayCoords(p, coordSystem)
          const erSkelpunkt = p.kilde === 'skelpunkt'
          return (
            <tr key={i}>
              <td>P{i + 1}</td>
              <td>{a}</td>
              <td>{b}</td>
              <td>
                <span
                  title={erSkelpunkt ? 'Skelpunkt' : 'Manuelt punkt'}
                  style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: erSkelpunkt ? '#d62728' : '#1f77b4',
                  }}
                />
              </td>
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