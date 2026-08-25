import React from "react";

export default function StarRating({ value = 0, onChange, size = "text-lg" }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className={`flex gap-1 ${size}`}>
      {stars.map((s) => (
        <span
          key={s}
          onClick={() => onChange && onChange(s)}
          className={`${onChange ? "cursor-pointer" : ""} ${s <= value ? "text-pop-yellow" : "text-pop-dark/20"}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}
