import { init } from 'raspi';
import { PWM } from 'raspi-pwm';

const MOD_BASE = 10000;
const MAX_DUTY = 1272;
const MIN_DUTY = 226;

async function sleep(msec) {
  return new Promise(r => {
    setTimeout(r, msec);
  });
}

class Servo {
  constructor(port = 1) {
    this.servo = new PWM({
      pin: port,
      frequency: 50
    });
  }

  free() {
    this.servo.write(0);
  }

  duty(duty) {
    const targetDuty = duty / MOD_BASE;
    console.log({targetDuty});
    this.servo.write(targetDuty);
  }
}

//  716
// 1220
const DEG_0 = MIN_DUTY + 50 + 100;
const DEG_90 = MIN_DUTY + 463 + 100;
const DEG_180 = MIN_DUTY + 810 + 100;
async function start() {
  const servo = new Servo('PWM0');
  const wait = 20;

  // servo.duty(MIN_DUTY);
  // await sleep(1000);
  // servo.duty(MAX_DUTY);
  // await sleep(1000);

  for(let i = 0; i < 4; i++) {
  servo.duty(DEG_0);
  await sleep(1000);

  servo.duty(DEG_90);
  await sleep(1000);

  servo.duty(DEG_180);
  await sleep(1000);

  servo.duty(DEG_90);
  await sleep(1000);

  servo.duty(DEG_0);
  await sleep(1000);

  servo.duty(DEG_180);
  await sleep(1000);

  servo.duty(DEG_90);
  }

  // for(let i = MIN_DUTY; i <= MAX_DUTY; i++) {
  //   servo.duty(i);
  //   await sleep(wait);
  // }
  // servo.duty(MIN_DUTY);
  await sleep(500);
  servo.free();
}

init(() => {
  start();
});
