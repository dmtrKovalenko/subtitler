import React from "react";
import classes from "./Spinner.module.css";

type LoaderProps = {
  sizeRem?: number;
};

export const Spinner: React.FC<LoaderProps> = ({ sizeRem }) => {
  const loaderStyle = {
    "--loader-size": sizeRem ? `${sizeRem}rem` : "1rem",
  } as React.CSSProperties; // Type assertion for CSS variables

  return <div className={classes.loader} style={loaderStyle}></div>;
};
