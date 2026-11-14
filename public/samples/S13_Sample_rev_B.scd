<?xml version="1.0" encoding="UTF-8"?>
<SCL xmlns="http://www.iec.ch/61850/2003/SCL" version="2007" revision="B" release="4">
 <Header id="S13_132-33kV" version="1.2" revision="A" toolID="SCL Studio" nameStructure="IEDName">
  <Text>Example substation configuration — 132/33 kV, two protection IEDs and a station gateway</Text>
  <History>
   <Hitem version="1.0" revision="A" when="2026-08-12" who="Engineering" what="Initial system configuration" why="FAT"/>
   <Hitem version="1.2" revision="A" when="2026-10-02" who="Engineering" what="Added transformer differential intertrip GOOSE" why="SAT findings"/>
  </History>
 </Header>
 <Substation name="S13" desc="132/33 kV Substation">
  <VoltageLevel name="E1" desc="132 kV busbar">
   <Voltage unit="V" multiplier="k">132</Voltage>
   <Bay name="Q01" desc="Line feeder L1">
    <ConductingEquipment name="QB1" type="DIS" desc="Busbar disconnector"/>
    <ConductingEquipment name="QA1" type="CBR" desc="Line circuit breaker">
     <LNode iedName="P132_Q01" ldInst="CTRL" lnClass="XCBR" lnInst="1"/>
     <LNode iedName="P132_Q01" ldInst="CTRL" lnClass="CSWI" lnInst="1"/>
    </ConductingEquipment>
    <ConductingEquipment name="BI1" type="CTR" desc="Line CT 800/1 A">
     <LNode iedName="P132_Q01" ldInst="PROT" lnClass="MMXU" lnInst="1"/>
    </ConductingEquipment>
    <ConductingEquipment name="QB9" type="DIS" desc="Line disconnector"/>
    <ConductingEquipment name="BU1" type="VTR" desc="Line VT"/>
    <LNode iedName="P132_Q01" ldInst="PROT" lnClass="PDIS" lnInst="1"/>
   </Bay>
   <Bay name="Q02" desc="Transformer T1 HV">
    <ConductingEquipment name="QB1" type="DIS"/>
    <ConductingEquipment name="QA1" type="CBR">
     <LNode iedName="P87T_T1" ldInst="PROT" lnClass="PTRC" lnInst="1"/>
    </ConductingEquipment>
    <ConductingEquipment name="BI1" type="CTR"/>
    <LNode iedName="P87T_T1" ldInst="PROT" lnClass="PDIF" lnInst="1"/>
   </Bay>
  </VoltageLevel>
  <VoltageLevel name="D1" desc="33 kV switchboard">
   <Voltage unit="V" multiplier="k">33</Voltage>
   <Bay name="J01" desc="T1 LV incomer">
    <ConductingEquipment name="QA1" type="CBR"/>
    <ConductingEquipment name="BI1" type="CTR"/>
   </Bay>
   <Bay name="J02" desc="Outgoing feeder F1">
    <ConductingEquipment name="QA1" type="CBR"/>
    <ConductingEquipment name="BI1" type="CTR"/>
    <ConductingEquipment name="QC1" type="DIS" desc="Earth switch"/>
   </Bay>
  </VoltageLevel>
  <PowerTransformer name="T1" type="PTR" desc="132/33 kV 60 MVA YNd11">
   <TransformerWinding name="W1" type="PTW"/>
   <TransformerWinding name="W2" type="PTW"/>
  </PowerTransformer>
 </Substation>
 <Communication>
  <SubNetwork name="StationBus" type="8-MMS" desc="Station bus, PRP LAN A">
   <BitRate unit="b/s" multiplier="M">100</BitRate>
   <ConnectedAP iedName="P132_Q01" apName="S1">
    <Address>
     <P type="IP">10.13.1.21</P><P type="IP-SUBNET">255.255.255.0</P><P type="IP-GATEWAY">10.13.1.1</P>
     <P type="OSI-AP-Title">1,3,9999,23</P><P type="OSI-AE-Qualifier">23</P><P type="OSI-PSEL">00000001</P><P type="OSI-SSEL">0001</P><P type="OSI-TSEL">0001</P>
    </Address>
    <GSE ldInst="PROT" cbName="GCB_TRIP">
     <Address><P type="MAC-Address">01-0C-CD-01-00-11</P><P type="APPID">0011</P><P type="VLAN-PRIORITY">4</P><P type="VLAN-ID">00A</P></Address>
     <MinTime unit="s" multiplier="m">4</MinTime><MaxTime unit="s" multiplier="m">1000</MaxTime>
    </GSE>
   </ConnectedAP>
   <ConnectedAP iedName="P87T_T1" apName="S1">
    <Address>
     <P type="IP">10.13.1.21</P><P type="IP-SUBNET">255.255.255.0</P><P type="IP-GATEWAY">10.13.1.1</P>
     <P type="OSI-AP-Title">1,3,9999,23</P><P type="OSI-AE-Qualifier">23</P><P type="OSI-PSEL">00000001</P><P type="OSI-SSEL">0001</P><P type="OSI-TSEL">0001</P>
    </Address>
    <GSE ldInst="PROT" cbName="GCB_DIFF">
     <Address><P type="MAC-Address">01-0C-CD-01-00-21</P><P type="APPID">0021</P><P type="VLAN-PRIORITY">4</P><P type="VLAN-ID">00A</P></Address>
     <MinTime unit="s" multiplier="m">4</MinTime><MaxTime unit="s" multiplier="m">1000</MaxTime>
    </GSE>
   </ConnectedAP>
   <ConnectedAP iedName="GW1" apName="S1">
    <Address><P type="IP">10.13.1.200</P><P type="IP-SUBNET">255.255.255.0</P><P type="IP-GATEWAY">10.13.1.1</P></Address>
   </ConnectedAP>
  </SubNetwork>
 </Communication>
 <IED name="P132_Q01" desc="132 kV line distance protection" manufacturer="ExampleVendor" type="LDP-500" configVersion="2.4" originalSclVersion="2007" originalSclRevision="B">
  <Services>
   <DynAssociation/><GetDirectory/><GetDataObjectDefinition/><DataObjectDirectory/><GetDataSetValue/><ReadWrite/>
   <ConfDataSet max="16" maxAttributes="60" modify="true"/>
   <ConfReportControl max="12"/><GetCBValues/><ReportSettings cbName="Conf" datSet="Conf" rptID="Dyn" optFields="Dyn" bufTime="Dyn" trgOps="Dyn" intgPd="Dyn"/>
   <GSESettings cbName="Conf" datSet="Conf" appID="Conf"/><GOOSE max="8"/><ConfLNs fixPrefix="true" fixLnInst="true"/>
  </Services>
  <AccessPoint name="S1">
   <Server>
    <Authentication/>
    <LDevice inst="PROT" desc="Protection">
     <LN0 lnClass="LLN0" inst="" lnType="LLN0_T">
      <DataSet name="DS_TRIP" desc="Fast trip GOOSE">
       <FCDA ldInst="PROT" lnClass="PTRC" lnInst="1" doName="Tr" daName="general" fc="ST"/>
       <FCDA ldInst="PROT" lnClass="PTRC" lnInst="1" doName="Tr" daName="q" fc="ST"/>
       <FCDA ldInst="PROT" lnClass="PDIS" lnInst="1" doName="Str" daName="general" fc="ST"/>
       <FCDA ldInst="PROT" lnClass="PDIS" lnInst="1" doName="Op" daName="general" fc="ST"/>
      </DataSet>
      <DataSet name="DS_MEAS" desc="Measurements to SCADA">
       <FCDA ldInst="PROT" lnClass="MMXU" lnInst="1" doName="TotW" fc="MX"/>
       <FCDA ldInst="PROT" lnClass="MMXU" lnInst="1" doName="Hz" fc="MX"/>
       <FCDA ldInst="PROT" lnClass="MMXU" lnInst="1" doName="A.phsA" fc="MX"/>
      </DataSet>
      <DataSet name="DS_EVT" desc="Events">
       <FCDA ldInst="PROT" lnClass="PTRC" lnInst="1" doName="Str" fc="ST"/>
       <FCDA ldInst="CTRL" lnClass="XCBR" lnInst="1" doName="Pos" fc="ST"/>
      </DataSet>
      <ReportControl name="urcbMeas" datSet="DS_MEAS" rptID="P132_Q01PROT/LLN0$RP$urcbMeas" confRev="1" buffered="false" bufTime="0" intgPd="5000">
       <TrgOps dchg="true" qchg="true" period="true" gi="true"/>
       <OptFields seqNum="true" timeStamp="true" dataSet="true" reasonCode="true"/>
       <RptEnabled max="4"><ClientLN iedName="GW1" ldInst="LD0" lnClass="ITCI" lnInst="1"/></RptEnabled>
      </ReportControl>
      <ReportControl name="brcbEvents" datSet="DS_EVT" rptID="P132_Q01PROT/LLN0$BR$brcbEvents" confRev="1" buffered="true" bufTime="50">
       <TrgOps dchg="true" qchg="true" gi="true"/>
       <OptFields seqNum="true" timeStamp="true" dataSet="true" reasonCode="true" entryID="true"/>
       <RptEnabled max="2"><ClientLN iedName="GW1" ldInst="LD0" lnClass="ITCI" lnInst="1"/></RptEnabled>
      </ReportControl>
      <GSEControl name="GCB_TRIP" datSet="DS_TRIP" appID="P132_Q01PROT/LLN0.GCB_TRIP" confRev="1" type="GOOSE">
       <IEDName>P87T_T1</IEDName>
      </GSEControl>
      <DOI name="Mod"><DAI name="ctlModel"><Val>status-only</Val></DAI></DOI>
      <DOI name="NamPlt"><DAI name="vendor"><Val>ExampleVendor</Val></DAI><DAI name="swRev"><Val>3.1.7</Val></DAI></DOI>
     </LN0>
     <LN lnClass="LPHD" inst="1" lnType="LPHD_T"/>
     <LN lnClass="PDIS" inst="1" lnType="PDIS_T" desc="Distance zone 1">
      <DOI name="PoRch"><SDI name="setMag"><DAI name="f"><Val>8.5</Val></DAI></SDI></DOI>
     </LN>
     <LN lnClass="PTRC" inst="1" lnType="PTRC_T" desc="Trip conditioning">
      <Inputs>
       <ExtRef iedName="P87T_T1" ldInst="PROT" lnClass="PDIF" lnInst="1" doName="Op" daName="general" serviceType="GOOSE" srcLDInst="PROT" srcLNClass="LLN0" srcCBName="GCB_DIFF" intAddr="BI_INTERTRIP_T1"/>
      </Inputs>
     </LN>
     <LN lnClass="MMXU" inst="1" lnType="MMXU_T" desc="Line measurements"/>
    </LDevice>
    <LDevice inst="CTRL" desc="Control">
     <LN0 lnClass="LLN0" inst="" lnType="LLN0_T"/>
     <LN lnClass="XCBR" inst="1" lnType="XCBR_T" desc="Circuit breaker QA1"/>
     <LN lnClass="CSWI" inst="1" lnType="CSWI_T" desc="Breaker control QA1">
      <DOI name="Pos"><DAI name="ctlModel"><Val>sbo-with-enhanced-security</Val></DAI></DOI>
     </LN>
    </LDevice>
   </Server>
  </AccessPoint>
 </IED>
 <IED name="P87T_T1" desc="Transformer T1 differential protection" manufacturer="ExampleVendor" type="TDP-300" configVersion="1.9">
  <Services>
   <GetDirectory/><GetDataObjectDefinition/><GetDataSetValue/><ReadWrite/>
   <ConfDataSet max="8" maxAttributes="40"/><ConfReportControl max="8"/><GOOSE max="4"/>
  </Services>
  <AccessPoint name="S1">
   <Server>
    <Authentication/>
    <LDevice inst="PROT">
     <LN0 lnClass="LLN0" inst="" lnType="LLN0_T">
      <DataSet name="DS_DIFF">
       <FCDA ldInst="PROT" lnClass="PDIF" lnInst="1" doName="Op" daName="general" fc="ST"/>
       <FCDA ldInst="PROT" lnClass="PDIF" lnInst="1" doName="Op" daName="q" fc="ST"/>
      </DataSet>
      <GSEControl name="GCB_DIFF" datSet="DS_DIFF" appID="P87T_T1PROT/LLN0.GCB_DIFF" confRev="2" type="GOOSE">
       <IEDName>P132_Q01</IEDName>
      </GSEControl>
     </LN0>
     <LN lnClass="LPHD" inst="1" lnType="LPHD_T"/>
     <LN lnClass="PDIF" inst="1" lnType="PDIF_T" desc="Differential element"/>
     <LN lnClass="PTRC" inst="1" lnType="PTRC_T">
      <Inputs>
       <ExtRef iedName="P132_Q01" ldInst="PROT" lnClass="PTRC" lnInst="1" doName="Tr" daName="general" serviceType="GOOSE" srcLDInst="PROT" srcLNClass="LLN0" srcCBName="GCB_TRIP" intAddr="BI_LINE_TRIP"/>
      </Inputs>
     </LN>
    </LDevice>
   </Server>
  </AccessPoint>
 </IED>
 <IED name="GW1" desc="Station gateway / SCADA client" manufacturer="ExampleVendor" type="GW-10" configVersion="1.0">
  <Services><GetDirectory/><ReadWrite/></Services>
  <AccessPoint name="S1">
   <Server>
    <Authentication/>
    <LDevice inst="LD0">
     <LN0 lnClass="LLN0" inst="" lnType="LLN0_T"/>
     <LN lnClass="ITCI" inst="1" lnType="ITCI_T" desc="Telecontrol interface"/>
    </LDevice>
   </Server>
  </AccessPoint>
 </IED>
 <DataTypeTemplates>
  <LNodeType id="LLN0_T" lnClass="LLN0">
   <DO name="Mod" type="ENC_Mod"/><DO name="Beh" type="ENS_Beh"/><DO name="Health" type="ENS_Health"/><DO name="NamPlt" type="LPL_NamPlt"/>
  </LNodeType>
  <LNodeType id="LPHD_T" lnClass="LPHD">
   <DO name="PhyNam" type="DPL_PhyNam"/><DO name="PhyHealth" type="ENS_Health"/><DO name="Proxy" type="SPS_T"/>
  </LNodeType>
  <LNodeType id="PTRC_T" lnClass="PTRC">
   <DO name="Mod" type="ENC_Mod"/><DO name="Beh" type="ENS_Beh"/><DO name="Str" type="ACD_T"/><DO name="Op" type="ACT_T"/><DO name="Tr" type="ACT_T"/>
  </LNodeType>
  <LNodeType id="PDIS_T" lnClass="PDIS">
   <DO name="Mod" type="ENC_Mod"/><DO name="Beh" type="ENS_Beh"/><DO name="Str" type="ACD_T"/><DO name="Op" type="ACT_T"/><DO name="PoRch" type="ASG_T"/>
  </LNodeType>
  <LNodeType id="PDIF_T" lnClass="PDIF">
   <DO name="Mod" type="ENC_Mod"/><DO name="Beh" type="ENS_Beh"/><DO name="Str" type="ACD_T"/><DO name="Op" type="ACT_T"/>
  </LNodeType>
  <LNodeType id="MMXU_T" lnClass="MMXU">
   <DO name="Mod" type="ENC_Mod"/><DO name="Beh" type="ENS_Beh"/><DO name="TotW" type="MV_T"/><DO name="Hz" type="MV_T"/><DO name="A" type="WYE_T"/>
  </LNodeType>
  <LNodeType id="XCBR_T" lnClass="XCBR">
   <DO name="Mod" type="ENC_Mod"/><DO name="Beh" type="ENS_Beh"/><DO name="Loc" type="SPS_T"/><DO name="OpCnt" type="INS_T"/><DO name="Pos" type="DPC_T"/>
  </LNodeType>
  <LNodeType id="CSWI_T" lnClass="CSWI">
   <DO name="Mod" type="ENC_Mod"/><DO name="Beh" type="ENS_Beh"/><DO name="Pos" type="DPC_T"/>
  </LNodeType>
  <LNodeType id="ITCI_T" lnClass="ITCI">
   <DO name="Mod" type="ENC_Mod"/><DO name="Beh" type="ENS_Beh"/>
  </LNodeType>
  <DOType id="ENC_Mod" cdc="ENC">
   <DA name="stVal" bType="Enum" type="BehaviourModeKind" fc="ST" dchg="true"/><DA name="q" bType="Quality" fc="ST" qchg="true"/><DA name="t" bType="Timestamp" fc="ST"/>
   <DA name="ctlModel" bType="Enum" type="CtlModelKind" fc="CF"><Val>status-only</Val></DA>
  </DOType>
  <DOType id="ENS_Beh" cdc="ENS">
   <DA name="stVal" bType="Enum" type="BehaviourModeKind" fc="ST" dchg="true"/><DA name="q" bType="Quality" fc="ST" qchg="true"/><DA name="t" bType="Timestamp" fc="ST"/>
  </DOType>
  <DOType id="ENS_Health" cdc="ENS">
   <DA name="stVal" bType="Enum" type="HealthKind" fc="ST" dchg="true"/><DA name="q" bType="Quality" fc="ST" qchg="true"/><DA name="t" bType="Timestamp" fc="ST"/>
  </DOType>
  <DOType id="LPL_NamPlt" cdc="LPL">
   <DA name="vendor" bType="VisString255" fc="DC"/><DA name="swRev" bType="VisString255" fc="DC"/><DA name="d" bType="VisString255" fc="DC"/><DA name="configRev" bType="VisString255" fc="DC"/>
  </DOType>
  <DOType id="DPL_PhyNam" cdc="DPL">
   <DA name="vendor" bType="VisString255" fc="DC"/><DA name="serNum" bType="VisString255" fc="DC"/><DA name="model" bType="VisString255" fc="DC"/>
  </DOType>
  <DOType id="SPS_T" cdc="SPS">
   <DA name="stVal" bType="BOOLEAN" fc="ST" dchg="true"/><DA name="q" bType="Quality" fc="ST" qchg="true"/><DA name="t" bType="Timestamp" fc="ST"/>
  </DOType>
  <DOType id="INS_T" cdc="INS">
   <DA name="stVal" bType="INT32" fc="ST" dchg="true"/><DA name="q" bType="Quality" fc="ST" qchg="true"/><DA name="t" bType="Timestamp" fc="ST"/>
  </DOType>
  <DOType id="ACT_T" cdc="ACT">
   <DA name="general" bType="BOOLEAN" fc="ST" dchg="true"/><DA name="phsA" bType="BOOLEAN" fc="ST" dchg="true"/><DA name="phsB" bType="BOOLEAN" fc="ST" dchg="true"/><DA name="phsC" bType="BOOLEAN" fc="ST" dchg="true"/>
   <DA name="q" bType="Quality" fc="ST" qchg="true"/><DA name="t" bType="Timestamp" fc="ST"/>
  </DOType>
  <DOType id="ACD_T" cdc="ACD">
   <DA name="general" bType="BOOLEAN" fc="ST" dchg="true"/><DA name="dirGeneral" bType="Enum" type="FaultDirectionKind" fc="ST" dchg="true"/>
   <DA name="q" bType="Quality" fc="ST" qchg="true"/><DA name="t" bType="Timestamp" fc="ST"/>
  </DOType>
  <DOType id="ASG_T" cdc="ASG">
   <DA name="setMag" bType="Struct" type="AnalogueValue_f" fc="SP"/><DA name="units" bType="Struct" type="Unit_T" fc="CF"/>
  </DOType>
  <DOType id="MV_T" cdc="MV">
   <DA name="mag" bType="Struct" type="AnalogueValue_f" fc="MX" dchg="true"/><DA name="q" bType="Quality" fc="MX" qchg="true"/><DA name="t" bType="Timestamp" fc="MX"/>
   <DA name="units" bType="Struct" type="Unit_T" fc="CF"/><DA name="db" bType="INT32U" fc="CF"><Val>1000</Val></DA>
  </DOType>
  <DOType id="CMV_T" cdc="CMV">
   <DA name="cVal" bType="Struct" type="Vector_T" fc="MX" dchg="true"/><DA name="q" bType="Quality" fc="MX" qchg="true"/><DA name="t" bType="Timestamp" fc="MX"/>
  </DOType>
  <DOType id="WYE_T" cdc="WYE">
   <SDO name="phsA" type="CMV_T"/><SDO name="phsB" type="CMV_T"/><SDO name="phsC" type="CMV_T"/>
  </DOType>
  <DOType id="DPC_T" cdc="DPC">
   <DA name="stVal" bType="Dbpos" fc="ST" dchg="true"/><DA name="q" bType="Quality" fc="ST" qchg="true"/><DA name="t" bType="Timestamp" fc="ST"/>
   <DA name="Oper" bType="Struct" type="DPCOperate_T" fc="CO"/>
   <DA name="ctlModel" bType="Enum" type="CtlModelKind" fc="CF"><Val>direct-with-normal-security</Val></DA>
  </DOType>
  <DOType id="SPC_Spare" cdc="SPC">
   <DA name="stVal" bType="BOOLEAN" fc="ST" dchg="true"/><DA name="q" bType="Quality" fc="ST"/><DA name="t" bType="Timestamp" fc="ST"/>
  </DOType>
  <DAType id="AnalogueValue_f"><BDA name="f" bType="FLOAT32"/></DAType>
  <DAType id="Vector_T"><BDA name="mag" bType="Struct" type="AnalogueValue_f"/><BDA name="ang" bType="Struct" type="AnalogueValue_f"/></DAType>
  <DAType id="Unit_T"><BDA name="SIUnit" bType="Enum" type="SIUnitKind"/><BDA name="multiplier" bType="Enum" type="MultiplierKind"/></DAType>
  <DAType id="Originator_T"><BDA name="orCat" bType="Enum" type="OriginatorCategoryKind"/><BDA name="orIdent" bType="Octet64"/></DAType>
  <DAType id="DPCOperate_T">
   <BDA name="ctlVal" bType="BOOLEAN"/><BDA name="origin" bType="Struct" type="Originator_T"/><BDA name="ctlNum" bType="INT8U"/><BDA name="T" bType="Timestamp"/><BDA name="Test" bType="BOOLEAN"/><BDA name="Check" bType="Check"/>
  </DAType>
  <EnumType id="BehaviourModeKind"><EnumVal ord="1">on</EnumVal><EnumVal ord="2">on-blocked</EnumVal><EnumVal ord="3">test</EnumVal><EnumVal ord="4">test/blocked</EnumVal><EnumVal ord="5">off</EnumVal></EnumType>
  <EnumType id="HealthKind"><EnumVal ord="1">Ok</EnumVal><EnumVal ord="2">Warning</EnumVal><EnumVal ord="3">Alarm</EnumVal></EnumType>
  <EnumType id="CtlModelKind"><EnumVal ord="0">status-only</EnumVal><EnumVal ord="1">direct-with-normal-security</EnumVal><EnumVal ord="2">sbo-with-normal-security</EnumVal><EnumVal ord="3">direct-with-enhanced-security</EnumVal><EnumVal ord="4">sbo-with-enhanced-security</EnumVal></EnumType>
  <EnumType id="FaultDirectionKind"><EnumVal ord="0">unknown</EnumVal><EnumVal ord="1">forward</EnumVal><EnumVal ord="2">backward</EnumVal><EnumVal ord="3">both</EnumVal></EnumType>
  <EnumType id="SIUnitKind"><EnumVal ord="1"></EnumVal><EnumVal ord="4">s</EnumVal><EnumVal ord="5">A</EnumVal><EnumVal ord="29">V</EnumVal><EnumVal ord="33">Hz</EnumVal><EnumVal ord="38">W</EnumVal><EnumVal ord="63">VA</EnumVal><EnumVal ord="64">Watts</EnumVal></EnumType>
  <EnumType id="MultiplierKind"><EnumVal ord="-3">m</EnumVal><EnumVal ord="0"></EnumVal><EnumVal ord="3">k</EnumVal><EnumVal ord="6">M</EnumVal></EnumType>
  <EnumType id="OriginatorCategoryKind"><EnumVal ord="0">not-supported</EnumVal><EnumVal ord="1">bay-control</EnumVal><EnumVal ord="2">station-control</EnumVal><EnumVal ord="3">remote-control</EnumVal><EnumVal ord="4">automatic-bay</EnumVal><EnumVal ord="5">automatic-station</EnumVal><EnumVal ord="6">automatic-remote</EnumVal><EnumVal ord="7">maintenance</EnumVal><EnumVal ord="8">process</EnumVal></EnumType>
 </DataTypeTemplates>
</SCL>
