#!/bin/bash
nicknames[0]="breezynoodles"
nicknames[1]="glumturnip"
nicknames[2]="blanddollop"
nicknames[3]="abortivepooch"
nicknames[4]="darkbamboo"
nicknames[5]="wateryladida"
nicknames[6]="hugeflagella"
nicknames[7]="sarcasticblimp"
nicknames[8]="murkysag"
nicknames[9]="pertinentornery"
nicknames[10]="macabrequibble"
nicknames[11]="secondcrapulence"
nicknames[12]="infamousfeline"
nicknames[13]="hulkingbritches"
nicknames[14]="nostalgicsludge"
nicknames[15]="moaningborborygm"
nicknames[16]="glibhunky"
nicknames[17]="overlookeddiphthong"
nicknames[18]="resolutemalarkey"
nicknames[19]="prudentphalange"
nicknames[20]="ficklesamovar"
nicknames[21]="livingcanoodle"
nicknames[22]="greysnout"
nicknames[23]="recklessphiltrum"
nicknames[24]="snivelingspry"
nicknames[25]="profitablefig"
nicknames[26]="jumpycrudivore"
nicknames[27]="pleasingidiopathic"
nicknames[28]="lackingding"
nicknames[29]="gargantuanlollygag"
nicknames[30]="foamywharf"
nicknames[31]="brightjiggle"
nicknames[32]="punctualturd"
nicknames[33]="amuckburgoo"
nicknames[34]="elatedkazoo"
nicknames[35]="royaloocephalus"
nicknames[36]="humblereservoir"
nicknames[37]="faintshrubbery"
nicknames[38]="spitefulfurbelow"
nicknames[39]="truculentturdiform"
nicknames[40]="immodestmagma"
nicknames[41]="omniscienttroglodyte"
nicknames[42]="haltingjerboa"
nicknames[43]="deeplynapkin"
nicknames[44]="bothblubber"
nicknames[45]="blueeyedstrudel"
nicknames[46]="giganticwabbit"
nicknames[47]="busyflume"
nicknames[48]="cutesickle"
nicknames[49]="firmargybargy"

if [ "$#" -ne 2 ];
    then echo "Usage $0 channel_url number_of_participants"
    exit 0
fi

scriptdir=`dirname "$BASH_SOURCE"`
channel_url=$1
num_users=$2
i=0
_TAG=coupleness_chat_tester

cd $scriptdir
cd ..
mkdir -p logs

while [[ $i -le $num_users ]]
do
    nickname=${nicknames[$i]}
    echo "Starting user [$i] $nickname"
    npm start ${channel_url} ${nickname} ${_TAG} > logs/${nickname}.log 2>&1 &
    i=$( expr $i + 1 )
done