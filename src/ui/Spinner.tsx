import React from "react";
import classes from "./Spinner.module.css";
import clsx from "clsx";

type LoaderProps = {
  sizeRem?: number;
  className?: string;
};

export const Spinner: React.FC<LoaderProps> = ({ sizeRem, className }) => {
  const loaderStyle = {
    "--loader-size": sizeRem ? `${sizeRem}rem` : "1rem",
  } as React.CSSProperties; // Type assertion for CSS variables

  return (
    <div className={clsx(classes.loader, className)} style={loaderStyle}></div>
  );
};
