import React from "react";
import styles from "../styles/Echo.module.css";

interface EchoProps {
  x: number;
  y: number;
}

const Echo: React.FC<EchoProps> = ({ x, y }) => {
  return <div className={styles.echo} style={{ top: y, left: x }} />;
};

export default Echo;
