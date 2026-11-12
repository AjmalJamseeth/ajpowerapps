<?xml version="1.0" encoding="UTF-8"?>
<SCL xmlns="http://www.iec.ch/61850/2003/SCL" version="2007" revision="B" release="4">
  <Header id="DEMO_BAY1" version="1" revision="A"/>
  <Communication>
    <SubNetwork name="StationBus" type="8-MMS">
      <ConnectedAP iedName="BAY1_PROT" apName="S1">
        <GSE ldInst="PROT" cbName="gcbTrip"><Address><P type="MAC-Address">01-0C-CD-01-00-01</P><P type="APPID">0001</P><P type="VLAN-ID">00A</P><P type="VLAN-PRIORITY">4</P></Address><MinTime unit="s" multiplier="m">4</MinTime><MaxTime unit="s" multiplier="m">1000</MaxTime></GSE>
      </ConnectedAP>
      <ConnectedAP iedName="BAY1_CTRL" apName="S1">
        <GSE ldInst="CTRL" cbName="gcbStatus"><Address><P type="MAC-Address">01-0C-CD-01-00-02</P><P type="APPID">0002</P><P type="VLAN-ID">00A</P><P type="VLAN-PRIORITY">4</P></Address><MinTime unit="s" multiplier="m">4</MinTime><MaxTime unit="s" multiplier="m">1000</MaxTime></GSE>
        <GSE ldInst="CTRL" cbName="gcbIntlk"><Address><P type="MAC-Address">01-0C-CD-01-00-03</P><P type="APPID">0003</P><P type="VLAN-ID">00A</P><P type="VLAN-PRIORITY">4</P></Address><MinTime unit="s" multiplier="m">4</MinTime><MaxTime unit="s" multiplier="m">1000</MaxTime></GSE>
        <GSE ldInst="CTRL" cbName="gcbAlarm"><Address><P type="MAC-Address">01-0C-CD-01-00-04</P><P type="APPID">0004</P><P type="VLAN-ID">00A</P><P type="VLAN-PRIORITY">4</P></Address><MinTime unit="s" multiplier="m">4</MinTime><MaxTime unit="s" multiplier="m">1000</MaxTime></GSE>
      </ConnectedAP>
    </SubNetwork>
    <SubNetwork name="ProcessBus" type="SMV">
      <ConnectedAP iedName="MU01" apName="P1">
        <SMV ldInst="MU" cbName="smvcb1"><Address><P type="MAC-Address">01-0C-CD-04-00-01</P><P type="APPID">4000</P><P type="VLAN-ID">014</P><P type="VLAN-PRIORITY">4</P></Address></SMV>
      </ConnectedAP>
    </SubNetwork>
  </Communication>
  <IED name="BAY1_PROT"><AccessPoint name="S1"><Server><LDevice inst="PROT"><LN0 lnClass="LLN0" inst="" lnType="LLN0_T">
    <DataSet name="dsTrip"><FCDA ldInst="PROT" lnClass="PTRC" lnInst="1" doName="Tr" daName="general" fc="ST"/><FCDA ldInst="PROT" lnClass="PTRC" lnInst="1" doName="Tr" daName="q" fc="ST"/></DataSet>
    <GSEControl name="gcbTrip" datSet="dsTrip" confRev="1" appID="BAY1_TRIP"/>
  </LN0></LDevice></Server></AccessPoint></IED>
  <IED name="BAY1_CTRL"><AccessPoint name="S1"><Server><LDevice inst="CTRL"><LN0 lnClass="LLN0" inst="" lnType="LLN0_T">
    <DataSet name="dsStatus"><FCDA ldInst="CTRL" lnClass="XCBR" lnInst="1" doName="Pos" daName="stVal" fc="ST"/><FCDA ldInst="CTRL" lnClass="XCBR" lnInst="1" doName="Pos" daName="q" fc="ST"/></DataSet>
    <DataSet name="dsIntlk"><FCDA ldInst="CTRL" lnClass="CILO" lnInst="1" doName="EnaCls" daName="stVal" fc="ST"/><FCDA ldInst="CTRL" lnClass="CILO" lnInst="1" doName="EnaCls" daName="q" fc="ST"/></DataSet>
    <DataSet name="dsAlarm"><FCDA ldInst="CTRL" lnClass="GGIO" lnInst="1" doName="Alm1" daName="stVal" fc="ST"/></DataSet>
    <GSEControl name="gcbStatus" datSet="dsStatus" confRev="3" appID="BAY1_STATUS"/>
    <GSEControl name="gcbIntlk" datSet="dsIntlk" confRev="1" appID="BAY1_INTLK"/>
    <GSEControl name="gcbAlarm" datSet="dsAlarm" confRev="1" appID="BAY1_ALARM"/>
  </LN0></LDevice></Server></AccessPoint></IED>
  <IED name="MU01"><AccessPoint name="P1"><Server><LDevice inst="MU"><LN0 lnClass="LLN0" inst="" lnType="LLN0_T">
    <DataSet name="PhsMeas1"/>
    <SampledValueControl name="smvcb1" smvID="MU01_SV" datSet="PhsMeas1" confRev="1" smpRate="80" nofASDU="1" smpMod="SmpPerPeriod" multicast="true"/>
  </LN0></LDevice></Server></AccessPoint></IED>
</SCL>
