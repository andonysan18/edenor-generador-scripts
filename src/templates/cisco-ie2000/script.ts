import type { DeviceConfig } from '../../config/device-config';
import type { Mark, Values } from '../types';

const cabecera = (s: string) => /^a\s/i.test(s) ? s : 'A ' + s;

export function buildCiscoIe2000(v: Values, M: Mark, cfg: DeviceConfig): string {
  const allowed = v.mg && v.rt ? [+v.rt, +v.mg].sort((a, b) => a - b).join(',') : '';
  const uplink = (c: string) =>
    (c ? ` description ${M(cabecera(c))}\n` : '') +
    ` switchport trunk allowed vlan ${M(allowed, 'vlans')}\n` +
    ` switchport trunk native vlan ${M(v.mg, 'vlan-mgmt')}\n` +
    ` switchport mode trunk\n`;

  return `version 15.2
no service pad
service timestamps debug datetime msec
service timestamps log datetime msec
service password-encryption
!
hostname ${M(v.punto ? 'SW-' + v.punto : '', 'punto-tlc')}
!
boot-start-marker
boot-end-marker
!
!
enable secret 5 ${cfg.enableSecret}
!
username ${cfg.adminUser} password 7 ${cfg.adminPassword7}
no aaa new-model
system mtu routing 1500
!
lldp run
!
vlan ${M(v.mg, 'vlan-mgmt')}
name Management
!
!
vlan ${M(v.rt, 'vlan-rtu')}
name TLC-CTxFO
!
interface Vlan${M(v.mg, 'vlan-mgmt')}
 no shutdown
 description Management
 ip address ${M(v.ip, 'ip-lan')} ${v.mask}
!
ip default-gateway ${M(v.gw, 'gateway')}
no ip http server
no ip http secure-server
ip forward-protocol nd
!
!
ip domain-name ${cfg.domain}
no ip cef
!
crypto key generate rsa
1024
!
!
spanning-tree mode rapid-pvst
spanning-tree extend system-id
!
alarm profile defaultPort
 alarm not-operating
 syslog not-operating
 notifies not-operating
!
!
!
vlan internal allocation policy ascending
!
!
!
!
!
!
interface FastEthernet0/1
 description RTU
 switchport access vlan ${M(v.rt, 'vlan-rtu')}
!
interface FastEthernet0/2
 shutdown
!
interface FastEthernet0/3
 shutdown
!
interface FastEthernet0/4
 shutdown
!
interface GigabitEthernet0/1
${uplink(v.c1)}!
interface GigabitEthernet0/2
${uplink(v.c2)}!
interface Vlan1
 no ip address
!
line con 0
 login local
line vty 0 4
 login local
 transport input ssh
line vty 5 15
 login local
 transport input ssh
!
ntp server ${cfg.ntpServer}
!
snmp-server community ${cfg.snmpCommunity} RO
snmp-server user ${cfg.snmpV3User} ${cfg.snmpV3Group} v3 auth md5 ${cfg.snmpV3Auth} priv des ${cfg.snmpV3Priv}
snmp-server group ${cfg.snmpV3Group} v3 priv
!
do wr
!`;
}
