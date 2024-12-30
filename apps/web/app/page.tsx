import { PredictiveInput } from '@predictive-typing/predictive-input';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <PredictiveInput />
      </div>
    </div>
  );
}
