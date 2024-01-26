// Initialisierung
// Serielle Schnittstelle initialisieren (zum PC)
serial.redirectToUSB()
serial.setBaudRate(115200)
serial.setRxBufferSize(128)
// Die Funkschnittstelle initialisieren
radio.setGroup(1)
radio.setTransmitPower(7)
radio.setFrequencyBand(0)
// Variable um Änderungen am Poti Bit zu verfolgen
let oldPVal = edubitPotentioBit.readPotValue()
let newPVal = oldPVal
// Timerdaten nur für Heartbeat
let Mytimer1 = 10
let timerTimeout1 = 12
StartTimer1(500)
let Mytimer2 = 11
let timerTimeout2 = 13

// Timer1 starten
function StartTimer1(n: number){
    control.runInParallel(function (){
        pause(n)
        control.raiseEvent(Mytimer1,timerTimeout1)
    })
}
// Der Event Handler für den Timer1
control.onEvent(Mytimer1,timerTimeout1,function(){
    edubitTrafficLightBit.toggleLed(LedColor.Red)
    StartTimer1(500)
})

// Timer2 starten
function StartTimer2(n: number) {
    control.runInParallel(function () {
        edubitTrafficLightBit.toggleLed(LedColor.Yellow)
        pause(n)
        control.raiseEvent(Mytimer2, timerTimeout2)
    })
}

// Der Event Handler für den Timer2
control.onEvent(Mytimer2, timerTimeout2, function () {
    edubitTrafficLightBit.toggleLed(LedColor.Yellow)
})

// Daten vom Bot werden am LCD angezeigt und an die serielle Schnittstelle weitergereicht
radio.onReceivedString(function (receivedString) {
    serial.writeLine(receivedString)
})
radio.onReceivedNumber(function (receivedNumber) {
    serial.writeLine(receivedNumber.toString())
})
radio.onReceivedValue(function(str, num)
{
    serial.writeLine(num.toString() + " " + str)
})

// Wertet Änderungen des Poti Bits aus
basic.forever(function () {
    newPVal = edubitPotentioBit.readPotValue()
    if (Math.abs(newPVal - oldPVal) > 2) {
        oldPVal = newPVal
        radio.sendValue(newPVal.toString(),5)
        serial.writeLine("Speedfactor: " + newPVal)
        StartTimer2(500)
    }   
})
// Wartet im Hintergrund auf Daten vom PC
control.inBackground(function () {
    serial.onDataReceived(serial.delimiters(Delimiters.NewLine), () => {
    let din = serial.readUntil(serial.delimiters(Delimiters.NewLine))
    serial.writeLine(din)
    // Daten auswerten
    // Zuerst spezielle Kommandos, die als String an den Bot gesendet werden
    if(din.substr(0,3)== "DME")
    {
        radio.sendString(din)
    }
    else
    // Die Steuerbefehle für Motoren und Lichter als String, die einzelnen Elemente sind durch ";" getrennt
    // % linker Motor; % rechter Motor; Dauer; RGB links; RGB rechts
    // Beispiel: -50;50;0;0xff0000;0x00ff00 -> Der Bot fährt links herum im Kreis, Dauer 0 bedeutet endlos, linkes Licht rot, rechtes Licht blau
    // Da über Funk maximal 19 Byte pro Sendung übertragen werden, wir der Kommandostring zerlegt und portionsweise als "Key-Value Pair"versendet
    {
        let a: string[] = []
        a = din.split(";")
        for (let i = 0; i < a.length; i++) {
            radio.sendValue(a[i], i)
        }
    }       
    })
})
