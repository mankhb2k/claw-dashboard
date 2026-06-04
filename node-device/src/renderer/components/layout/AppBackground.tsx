import styles from "./AppBackground.module.css";

type AppBackgroundProps = {
  active: boolean;
};

export function AppBackground({ active }: AppBackgroundProps) {
  const orbClass = active ? styles.orb : `${styles.orb} ${styles.orbDisconnected}`;

  return (
    <>
      <div class={`${orbClass} ${styles.orbTop}`} aria-hidden="true" />
      <div class={`${orbClass} ${styles.orbBottom}`} aria-hidden="true" />
    </>
  );
}
