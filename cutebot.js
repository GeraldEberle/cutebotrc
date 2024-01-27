// Ein paar globale Variable 
let sonarNew = 0
let sonarLast = 0
let MyTimer1 = 10
let timerTimout1 = 12
let MyTimer2 = 11
let timerTimout2 = 13
let flashLight = true
let Speed = 1
let dme = false
let cmdList: number[] = []
cmdList = [0, 0, 0, 0, 0, 0]
// Einstellungen Funk
radio.setGroup(1)
radio.setTransmitPower(7)
radio.setFrequencyBand(0)
// Die Neopixel aktivieren
let strip = neopixel.create(DigitalPin.P15, 2, NeoPixelMode.RGB)
let left = strip.range(0,1)
let right = strip.range(1,1)
// Erstmal alles anhalten
cuteBot.stopcar()
cuteBot.colorLight(cuteBot.RGBLights.ALL, 0x000000)

// Setzt die Motoren
function MoveBot(lE: number, rE: number) {
    cuteBot.motors(Speed * lE, Speed * rE)
}
// Setzt die Lichter
function SetLights(ll: number, rl: number) {
    cuteBot.colorLight(cuteBot.RGBLights.RGB_L, ll)
    cuteBot.colorLight(cuteBot.RGBLights.RGB_R, rl)
    if(flashLight == true)
    {
        left.showColor(ll)
        right.showColor(rl)
        StartTimer2(500)
    }
    else
    {
        left.showColor(0)
        right.showColor(0)
    }
}
// Startet einen Timer für das Ende der Bewegung
function StartTimer1(n: number) {
    control.runInParallel(function () {
        pause(n)
        control.raiseEvent(MyTimer1, timerTimout1)
    })
}
// Der Event Handler für den Timer
control.onEvent(MyTimer1, timerTimout1, function () {
    cuteBot.stopcar()
})

// Startet einen Timer für die Lichter
function StartTimer2(n: number) {
    control.runInParallel(function () {
        left.showColor(cmdList[3])
        right.showColor(cmdList[4])
        pause(n)
        left.showColor(cmdList[4])
        right.showColor(cmdList[3])
        pause(n)
        control.raiseEvent(MyTimer2, timerTimout2)  
    })
}

// Der Event Handler für den Timer
control.onEvent(MyTimer2, timerTimout2, function () {
    if(flashLight == true)
    {
        StartTimer2(500)
    }
    else {
        left.showColor(0)
        right.showColor(0)
    }   
})

// Eine Zahl kommt über Funk
radio.onReceivedNumber(function (receivedNumber) {
    //Speed = receivedNumber
    radio.sendString(receivedNumber.toString())
    //MoveBot()
})

// Ein String kommt über Funk
radio.onReceivedString(function (receivedString: string) {
    if (receivedString == "DME on") { dme = true }
    else if (receivedString == "DME off") {
        dme = false
    }
    else if (receivedString == "Flash on")
    {
        flashLight = true
    }
    else if (receivedString == "Flash off") {
        flashLight = false
    }
})

// Ein Wertepaar kommt über Funk
radio.onReceivedValue(function (cmd, value) {

    cmdList[value] = parseInt(cmd)
    if (value == 2) {
        MoveBot(cmdList[0], cmdList[1])
    }
    if (value == 4) {
        SetLights(cmdList[3], cmdList[4])
        if (cmdList[2] != 0) {
            StartTimer1(cmdList[2])
        }
    }
    if(value == 5){
        Speed = cmdList[5] / 1000
        MoveBot(cmdList[0], cmdList[1])
    }
})

// Die Endlosschleife behandelt den Ultraschallsensor
basic.forever(function () {
    sonarNew = cuteBot.ultrasonic(cuteBot.SonarUnit.Centimeters)
    if (sonarNew > 2 && sonarNew < 15) {
        cuteBot.stopcar()
        for (let index = 0; index < 4; index++) {
            music.play(music.tonePlayable(880, music.beat(BeatFraction.Quarter)), music.PlaybackMode.UntilDone)
        }
        cuteBot.motors(-75, -75)
        basic.pause(200)
        cuteBot.stopcar()
        radio.sendString("Hindernis in " + sonarNew.toString() + " cm")
    }
    if (dme == true) {
        if (Math.abs(sonarNew - sonarLast) > 2) {
            sonarLast = sonarNew
            if (sonarNew > 2 && sonarNew < 100) {
                radio.sendString("Distanz " + sonarNew.toString() + " cm")
            }

        }
    }
})