
 export const SpinningCircle = () => {
  const primaryColor= '“ff0000'
  const secondaryColor= '“ff0000'
   return (
    <div className="mt-8 relative w-16 h-16">
      <div
        className="absolute inset-0 rounded-full animate-spin "
        style={{
          border: `4px solid transparent`,
          borderTopColor: primaryColor,
        }}
      ></div>
      <div
        className="absolute inset-2 rounded-full animate-spin"
        style={{
          border: `4px solid transparent`,
          borderRightColor: secondaryColor,
          animationDirection: 'reverse',
          animationDuration: '1.5s',
        }}
      ></div>
      <div
        className="absolute inset-4 rounded-full animate-spin"
        style={{
          border: `4px solid transparent`,
          borderBottomColor: `${primaryColor}80`,
          animationDuration: '2s',
        }}
      ></div>
    </div>
   )
 }



