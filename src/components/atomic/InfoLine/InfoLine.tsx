export const InfoLine = ({
  label,
  value,
}: {
  label: string
  value: string
}) => (
  <p>
    <span className="font-medium text-gray-600">{label} :</span>{' '}
    <span className="text-gray-800">{value}</span>
  </p>
)
