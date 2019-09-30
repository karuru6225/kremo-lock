import { init } from 'raspi';
import {
  DigitalInput,
  DigitalOutput,
  PULL_UP,
  LOW,
  HIGH
} from 'raspi-gpio';
import { PWM } from 'raspi-pwm';
import { exec } from 'child_process';

//=============== ble ibeacon test

// const SERVICE_UUID = '7617232B-BDE0-4B27-A05B-41A2B579DDBE';
// const SERVICE_UUID = '1819';
const SERVICE_UUID = '48534442-4C45-4144-80C0-1800FFFFFFFF';

import Bleacon from 'bleacon-fork';
const sUuid = SERVICE_UUID.split('-').map(s => s.toLowerCase()).join('');
const AVG_CNT = 20;
const DACC_CNT = 3;
let last = 0;
let lastRotate = 0;
let accs = [];
let dAccs = [];
let lastAcc = 0;
let ready2Lock = false;
let ready2Unlock = false;
Bleacon.startScanning(sUuid);
Bleacon.on('discover', (bleacon) => {
  if (last === 0) {
    last = Date.now();
  }
  if (Date.now() - lastRotate < 2000) {
    return;
  }
  const {
    accuracy,
    proximity: prox
  } = bleacon;
  accs.push(accuracy);
  accs = accs.slice(-AVG_CNT);
  if (
    Date.now() - last > 500
    && accs.length > 0
  ) {
    const cnt = Math.min(accs.length, AVG_CNT);
    const sum = accs.reduce((a, c) => a + c);
    const acc = Math.round(sum * 10 / cnt) / 10;

    const dAcc = acc - lastAcc;

    dAccs.push(dAcc);
    dAccs = dAccs.slice(-DACC_CNT);

    const dCnt = Math.min(dAccs.length, DACC_CNT);
    const dSum = dAccs.reduce((a, c) => a + c);
    const avdAcc = Math.round(dSum * 10 / dCnt) / 10;

    // console.log(`acc ${acc} dAcc ${avdAcc}`);
    lastAcc = acc;
    if (keyState === 'lock') {
      if (acc < 3) {
        if (ready2Unlock) {
          keyUnlock();
          lastRotate = Date.now();
          ready2Unlock = false;
        } else {
          ready2Unlock = true;
        }
      } else {
        ready2Unlock = false;
      }
    } else if (keyState === 'unlock') {
      if (acc >= 4) {
        if (ready2Lock) {
          keyLock();
          lastRotate = Date.now();
          ready2Lock = false;
        } else {
          ready2Lock = true;
        }
      } else {
        ready2Lock = false;
      }
    }
    last = Date.now();
  }
});

/** node-beacon-scanner ***/
// import noble from '@abandonware/noble';
// import BeaconScanner from 'node-beacon-scanner';
// const scanner = new BeaconScanner({noble});
//
// noble.on('stateChange', (state) => {
//   if (state === "poweredOff") {
//     scanner.stopScan()
//   } else if (state === "poweredOn") {
//     scanner.startScan()
//   }
// });
//
// let cnt = 0;
// let sum = 0;
// let last = 0;
//
// // Set an Event handler for becons
// scanner.onadvertisement = (ad) => {
//   if (ad.iBeacon && ad.iBeacon.uuid === SERVICE_UUID) {
//     const rssi = ad.rssi;
//     const txPower = ad.iBeacon.txPower;
//     const d = 10 ** ((txPower - rssi) / 20.0);
//     sum += d;
//     cnt += 1;
//     if (Date.now() - last >= 500) {
//       console.log(sum / cnt);
//       sum = 0;
//       cnt = 0;
//       last = Date.now();
//     }
//   }
// };
//
// // Start scanning
// scanner.startScan().then(() => {
//   console.log('Started to scan.')  ;
//   last = Date.now();
// }).catch((error) => {
//   console.error(error);
// });
/** node-beacon-scanner ***/

// noble.on('stateChange', (state) => {
//   console.log('noble stateChange');
//   console.log(JSON.stringify(state));
//   if (state === 'poweredOn') {
//     // noble.startScanning([SERVICE_UUID]);
//     noble.startScanning();
//   } else {
//     noble.stopScanning();
//   }
// });
//
// noble.on('discover', (peripheral) => {
//   console.log(`address: ${peripheral.address}`);
//   console.log(`name: ${peripheral.advertisement.localName}`);
//   console.log(peripheral.toString());
//
//   // peripheral.connect((connectError) => {
//   //   peripheral.discoverServices(SERVICE_UUID, (serviceErr, services) => {
//   //     console.log('=== services ===');
//   //     const targetService = services[0];
//   //     targetService.discoverCharacteristics([], (characteristicsErr, characteristics) => {
//   //       console.log('=== characteristics ===');
//   //       console.log(characteristics.toString());
//   //       console.log('=== =============== ===');
//   //     });
//   //     console.log('=== ======== ===');
//   //   });
//   // });
//   // for (let i in peripheral) {
//   //   console.log(`peripheral.${i}`);
//   // }
//
//   // const serviceData = peripheral.advertisement.serviceData;
//   // if (serviceData && serviceData.length) {
//   //   serviceData.forEach(d => {
//   //     console.log(`service uuid: ${d.uuid}`);
//   //   });
//   // }
//   console.log('===================');
//   // console.log('peripheral discovered (' + peripheral.id +
//   //             ' with address <' + peripheral.address +  ', ' + peripheral.addressType + '>,' +
//   //             ' connectable ' + peripheral.connectable + ',' +
//   //             ' RSSI ' + peripheral.rssi + ':');
//   // console.log('\thello my local name is:');
//   // console.log('\t\t' + peripheral.advertisement.localName);
//   // console.log('\tcan I interest you in any of the following advertised services:');
//   // console.log('\t\t' + JSON.stringify(peripheral.advertisement.serviceUuids));
// });

//=============== ble ibeacon test

const MOD_BASE = 10000;
const MAX_DUTY = 1272;
const MIN_DUTY = 226;
const SERVO_WAIT = 1500;

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
    this.timer = null;
  }

  free() {
    this.timer = null;
    // console.log({targetDuty:0});
    this.servo.write(0);
  }

  duty(duty) {
    const targetDuty = duty / MOD_BASE;
    // console.log({targetDuty});
    this.servo.write(targetDuty);
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.timer = setTimeout(() => {
      this.free();
    }, SERVO_WAIT);
  }
}

class IndicatorLed {
  constructor() {
    this.green = new DigitalOutput('P1-15');
    this.red = new DigitalOutput('P1-18');
  }
  lock() {
    this.green.write(LOW);
    this.red.write(HIGH);
  }
  unlock() {
    this.green.write(HIGH);
    this.red.write(LOW);
  }
  unknown() {
    this.green.write(HIGH);
    this.red.write(HIGH);
  }
  off() {
    this.green.write(LOW);
    this.red.write(LOW);
  }
}

//  716
// 1220
const DEG_0 = MIN_DUTY + 50 + 100;
const DEG_90 = MIN_DUTY + 463 + 100;
const DEG_180 = MIN_DUTY + 810 + 100;

let keyServo;
let indicatorLed;
let keyState;
let operating = false;

async function keyLock() {
  if (operating) {
    return;
  }
  if (keyState === 'lock') {
    return;
  }
  operating = true;
  console.log('lock');
  keyState = 'lock';
  keyServo.duty(DEG_0);
  await sleep(SERVO_WAIT);
  keyFree();
  indicatorLed.lock();
  operating = false;
}

function keyFree() {
  console.log('free');
  keyServo.duty(DEG_90);
}

async function keyUnlock() {
  if (operating) {
    return;
  }
  if (keyState === 'unlock') {
    return;
  }
  operating = true;
  console.log('unlock');
  keyState = 'unlock';
  keyServo.duty(DEG_180);
  await sleep(SERVO_WAIT);
  keyFree();
  indicatorLed.unlock();
  operating = false;
}

const inputs = [
  {
    label: 'red', // lock
    pin: 'P1-13'
  },
  {
    label: 'yellow',
    pin: 'P1-11'
  },
  {
    label: 'green', // unlock
    pin: 'P1-7'
  },
  {
    label: 'blue', // boot or shutdown
    pin: 'P1-5'
  },
];

async function started() {
  indicatorLed.lock();
  await sleep(200);

  indicatorLed.off();
  await sleep(100);

  indicatorLed.unknown();
  await sleep(200);

  indicatorLed.off();
  await sleep(100);

  indicatorLed.unlock();
  await sleep(200);

  indicatorLed.off();
  await sleep(100);

  keyUnlock();
}

async function exitHandler() {
  console.log('exitting');
  indicatorLed.off();
  await keyFree();
  await sleep(SERVO_WAIT);
  keyServo.free();
  noble.stopScanning();
  process.exit();
}

init(() => {
  keyServo = new Servo('P1-12');
  indicatorLed = new IndicatorLed();
  process.on('SIGINT', exitHandler);
  process.on('SIGTERM', exitHandler);
  const buttons = inputs.map(i => ({
    label: i.label,
    input: new DigitalInput({
      pin: i.pin,
      pullResistor: PULL_UP
    })
  }));
  buttons.forEach((b) => {
    b.input.on('change', (val) => {
      if (val === LOW) {
        switch(b.label) {
          case 'red':
            keyLock();
            break;
          case 'yellow':
            keyFree();
            break;
          case 'green':
            keyUnlock();
            // setTimeout(() => {
            //   keyLock();
            // }, 10000);
            break;
          case 'blue':
            exec('poweroff');
            break;
        }
      }
    });
  });
  started();
});
