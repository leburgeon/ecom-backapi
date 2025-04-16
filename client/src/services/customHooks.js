import { useState } from "react";

export const useControlledValue = (initialValue, label) => {
  const [value, setValue] = useState(initialValue)

  const onChange = (event) => {
    setValue(event.target.value)
  }

  return {value, onChange, label}
}

