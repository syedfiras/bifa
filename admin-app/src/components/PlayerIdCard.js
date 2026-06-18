import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

export const SIGNATURE_ASSET = require('../../assets/images/signbifa.png');

const CARD_TYPES = {
    normal: {
        label: 'Normal Card',
        passLabel: 'Valid ID Card',
        fileLabel: 'BIFA ID Card',
        border: '#f4ea26',
        accent: '#f4ea26',
        bgStart: '#1a1a1a',
        bgEnd: '#0c0c0c',
        panel: 'rgba(244,234,38,0.12)',
    },
    gold: {
        label: 'Gold Card',
        passLabel: 'Gold Pass',
        fileLabel: 'BIFA Gold Pass',
        border: '#ffd76a',
        accent: '#ffd76a',
        bgStart: '#f9d56a',
        bgEnd: '#ab7f13',
        panel: 'rgba(255,215,106,0.28)',
    },
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const fetchUriAsBase64 = async (uri) => {
    try {
        const response = await fetch(uri);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error('fetchUriAsBase64 error:', e);
        throw e;
    }
};

export const getAssetBase64 = async (assetModule, label) => {
    try {
        const asset = Asset.fromModule(assetModule);
        await asset.downloadAsync();
        const assetUri = asset.localUri || asset.uri;
        if (!assetUri) {
            throw new Error(`No URI available for ${label}`);
        }

        try {
            if (Platform.OS === 'web') {
                return await fetchUriAsBase64(assetUri);
            }

            const base64 = await FileSystem.readAsStringAsync(assetUri, {
                encoding: 'base64',
            });
            return `data:image/png;base64,${base64}`;
        } catch (readError) {
            console.warn(`FileSystem read failed for ${label}, trying fetch:`, readError);
            return await fetchUriAsBase64(assetUri);
        }
    } catch (e) {
        console.error(`Failed to load ${label}:`, e);
        return null;
    }
};

export const buildHtml = (player, signatureBase64, cardType = 'normal') => {
    const cardConfig = CARD_TYPES[cardType] || CARD_TYPES.normal;
    const isGold = cardType === 'gold';
    const statusColor = player.status === 'accepted' ? '#4CAF50' : '#f39c12';
    const positions = (player.positions || []).join(' - ');
    const headerRowBg = isGold
        ? 'linear-gradient(135deg, rgba(255,215,106,0.58), rgba(73,49,8,0.36))'
        : 'linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.36))';
    const headerPhotoBg = isGold
        ? 'rgba(255,215,106,0.22)'
        : 'transparent';
    const headerInfoBg = isGold
        ? 'linear-gradient(135deg, rgba(255,215,106,0.72), rgba(151,102,12,0.34))'
        : 'transparent';
    const headerNameColor = isGold ? '#15110a' : '#ffffff';
    const headerMetaColor = isGold ? '#4b3608' : cardConfig.accent;

    const photoHtml = player.profilePhoto
        ? `<img src="${player.profilePhoto}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" />`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#1a1a1a;">
             <svg width="40" height="40" viewBox="0 0 24 24" fill="${cardConfig.accent}"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
           </div>`;

    const accessPassHtml = player.accessPass ? `
      <div style="margin:10px 0 0;border-radius:6px;border:1.5px solid ${cardConfig.accent};background:${cardConfig.panel} !important;padding:10px 14px;display:flex;flex-direction:row;justify-content:space-between;align-items:center;">
        <span style="color:${cardConfig.accent};font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Access Pass</span>
        <span style="color:${cardConfig.accent};font-size:15px;font-weight:900;letter-spacing:2px;">${player.accessPass}</span>
      </div>` : '';

    const row = (label, value, color = '#ffffff') =>
        `<div style="display:flex;flex-direction:row;justify-content:space-between;align-items:center;padding:8px 0 8px 12px;border-bottom:1px solid rgba(244,234,38,0.12);border-left:3px solid ${cardConfig.accent};margin-bottom:4px;">
           <span style="color:${cardConfig.accent};font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.8px;flex:1;">${label}</span>
           <span style="color:${color};font-size:12px;font-weight:${color === '#ffffff' ? '500' : '900'};text-align:right;flex:2;">${value}</span>
         </div>`;

    const frontBgSvg = `
      <svg width="400" height="640" viewBox="0 0 400 640" preserveAspectRatio="xMidYMid slice"
           style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;">
        <rect x="0" y="0" width="400" height="175" fill="${cardConfig.accent}" opacity="${isGold ? '0.16' : '0'}"/>
        <rect x="135" y="0" width="265" height="175" fill="#000000" opacity="${isGold ? '0.08' : '0.22'}"/>
        <line x1="-10" y1="40" x2="80" y2="-10" stroke="${cardConfig.accent}" stroke-width="0.6" opacity="0.15"/>
        <line x1="-10" y1="70" x2="110" y2="-10" stroke="${cardConfig.accent}" stroke-width="0.6" opacity="0.15"/>
        <line x1="-10" y1="100" x2="140" y2="-10" stroke="${cardConfig.accent}" stroke-width="0.6" opacity="0.15"/>
        <polyline points="0,220 40,260 10,300 55,340 20,380 60,410 30,440 70,470 0,520" fill="none" stroke="${cardConfig.accent}" stroke-width="12" stroke-linejoin="round" stroke-linecap="round" opacity="0.2"/>
        <polyline points="400,240 360,280 390,320 345,360 380,400 340,430 370,460 330,490 400,540" fill="none" stroke="${cardConfig.accent}" stroke-width="12" stroke-linejoin="round" stroke-linecap="round" opacity="0.2"/>
      </svg>`;

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing:border-box; margin:0; padding:0; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
  html, body { background:#000000 !important; font-family:Arial,sans-serif; }
  .page { background:#000000 !important; width:100vw; min-height:100vh; display:flex; justify-content:center; align-items:center; padding:30px 20px; }
</style>
</head>
<body>
  <div class="page">
    <div style="width:400px;height:640px;background:linear-gradient(145deg, ${cardConfig.bgStart}, ${cardConfig.bgEnd}) !important;border-radius:16px;border:2.5px solid ${cardConfig.border};overflow:hidden;color:white;position:relative;">
      ${frontBgSvg}
      <div style="position:relative;z-index:1;height:100%;display:flex;flex-direction:column;justify-content:space-between;">
        <div style="display:flex;flex-direction:row;min-height:138px;border-bottom:2.5px solid ${cardConfig.border};overflow:hidden;background:${headerRowBg} !important;">
          <div style="flex:0 0 112px;background:${headerPhotoBg} !important;padding:18px 14px 18px 18px;display:flex;align-items:center;justify-content:center;">
            <div style="width:80px;height:100px;border-radius:8px;border:2px solid ${cardConfig.border};overflow:hidden;background:#1a1a1a !important;">
              ${photoHtml}
            </div>
          </div>
          <div style="flex:1;min-width:0;padding:18px 16px;background:${headerInfoBg} !important;display:flex;flex-direction:column;justify-content:center;gap:6px;overflow:hidden;">
            <div style="color:${headerNameColor};font-size:18px;font-weight:900;letter-spacing:0.3px;line-height:1.15;max-width:100%;overflow-wrap:anywhere;">${player.fullName}</div>
            <div style="color:${headerMetaColor};font-size:13px;font-weight:bold;letter-spacing:0.5px;max-width:100%;overflow-wrap:anywhere;">${positions}</div>
            <div style="display:inline-block;background:${cardConfig.accent} !important;color:#000;font-size:10px;font-weight:900;padding:2px 8px;border-radius:4px;letter-spacing:1px;align-self:flex-start;">${player.ageCategory || 'U20'}</div>
            <div style="color:${headerMetaColor};font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:1.6px;">${cardConfig.passLabel}</div>
          </div>
        </div>
        <div style="padding:14px 18px 12px;background:rgba(0,0,0,0.6) !important;flex:1;display:flex;flex-direction:column;justify-content:space-between;">
          <div>
            ${row('Email', player.email || 'N/A')}
            ${row('Phone', player.phone || 'N/A')}
            ${row('Date of Birth', formatDate(player.dateOfBirth))}
            ${row('Registration', formatDate(player.registrationDate))}
            ${row('Joining Year', String(player.joiningYear || (player.registrationDate ? new Date(player.registrationDate).getFullYear() : 'N/A')))}
            ${row('Status', String(player.status || 'Unknown').toUpperCase(), statusColor)}
            ${accessPassHtml}
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;padding-right:10px;margin-top:24px;">
            ${signatureBase64 ? `<img src="${signatureBase64}" style="width:120px;height:48px;object-fit:contain;margin-bottom:-3px;" />` : `<div style="width:120px;height:48px;"></div>`}
            <div style="width:110px;height:1px;background:${cardConfig.accent} !important;opacity:0.55;margin-bottom:4px;"></div>
            <div style="color:rgba(255,255,255,0.6);font-size:8px;font-weight:bold;text-transform:uppercase;letter-spacing:1.2px;">BIFA Secretary</div>
          </div>
        </div>
        <div style="padding:12px 18px;display:flex;flex-direction:row;justify-content:space-between;align-items:center;border-top:2px solid ${cardConfig.border};background:${cardConfig.panel} !important;">
          <div style="color:${cardConfig.accent};font-size:14px;font-weight:900;letter-spacing:3px;">BIFA</div>
          <div style="text-align:right;">
            <div style="color:#fff;font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;">Player Identification</div>
            <div style="color:${cardConfig.accent};font-size:8px;letter-spacing:1px;margin-top:2px;">${cardConfig.passLabel}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

const PlayerIdCard = ({ player }) => {
    const [downloading, setDownloading] = React.useState(false);
    const [cardType, setCardType] = React.useState('normal');
    const cardConfig = CARD_TYPES[cardType];
    const isGold = cardType === 'gold';
    const positions = (player.positions || []).join(' - ');

    const handleDownload = async () => {
        try {
            setDownloading(true);
            const signatureBase64 = await getAssetBase64(SIGNATURE_ASSET, 'signature');
            const html = buildHtml(player, signatureBase64, cardType);

            const { uri } = await Print.printToFileAsync({
                html,
                base64: false,
                width: 440,
                height: 700,
            });

            const isWeb = Platform.OS === 'web';
            const canShare = !isWeb && await Sharing.isAvailableAsync();

            if (isWeb) {
                const link = document.createElement('a');
                link.href = uri;
                link.download = `${player.fullName} - ${cardConfig.fileLabel}.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                return;
            }

            if (!canShare) {
                Alert.alert('Unavailable', 'Sharing is not available on this device.');
                return;
            }

            await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                dialogTitle: `${player.fullName} - ${cardConfig.fileLabel}`,
                UTI: 'com.adobe.pdf',
            });
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Error', 'Failed to generate card. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Player Card</Text>
                <TouchableOpacity
                    style={[styles.downloadBtn, isGold && styles.goldDownloadBtn, downloading && { opacity: 0.7 }]}
                    onPress={handleDownload}
                    disabled={downloading}
                    activeOpacity={0.8}
                >
                    {downloading
                        ? <ActivityIndicator size="small" color="#0c0c0c" />
                        : <Ionicons name="download" size={20} color="#0c0c0c" />
                    }
                </TouchableOpacity>
            </View>

            <View style={styles.typeSelector}>
                {Object.entries(CARD_TYPES).map(([type, config]) => {
                    const selected = cardType === type;
                    return (
                        <TouchableOpacity
                            key={type}
                            onPress={() => setCardType(type)}
                            activeOpacity={0.8}
                            style={[styles.typeBtn, selected && styles.typeBtnActive, type === 'gold' && selected && styles.goldTypeBtnActive]}
                        >
                            <Ionicons name={type === 'gold' ? 'ribbon' : 'id-card-outline'} size={16} color={selected ? '#0c0c0c' : config.accent} />
                            <Text style={[styles.typeBtnText, selected && styles.typeBtnTextActive, type === 'gold' && !selected && styles.goldText]}>{config.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={[styles.idCard, isGold && styles.goldIdCard]}>
                <LinearGradient colors={[cardConfig.bgStart, cardConfig.bgEnd]} style={StyleSheet.absoluteFillObject} />
                {isGold && <View style={styles.goldSheen} />}
                <View style={[styles.cardHeader, isGold && styles.goldCardHeader]}>
                    <View style={styles.photoContainer}>
                        {player.profilePhoto ? (
                            <Image source={{ uri: player.profilePhoto }} style={[styles.playerPhoto, isGold && styles.goldBorder]} />
                        ) : (
                            <View style={[styles.photoPlaceholder, isGold && styles.goldBorder]}>
                                <Ionicons name="person" size={40} color={cardConfig.accent} />
                            </View>
                        )}
                    </View>
                    <View style={[styles.headerInfo, isGold && styles.goldHeaderInfo]}>
                        <Text style={[styles.playerName, isGold && styles.goldPlayerName]}>{player.fullName}</Text>
                        <Text style={[styles.playerPosition, isGold && styles.goldText]}>{positions}</Text>
                        <Text style={[styles.playerCategory, isGold && styles.goldPlayerCategory]}>{player.ageCategory || 'U20'}</Text>
                        <Text style={[styles.passLabel, isGold && styles.goldText]}>{cardConfig.passLabel}</Text>
                    </View>
                </View>
                <View style={[styles.cardBody, isGold && styles.goldCardBody]}>
                    {[
                        { icon: 'mail', label: 'Email', value: player.email || 'N/A' },
                        { icon: 'call', label: 'Phone', value: player.phone || 'N/A' },
                        { icon: 'calendar', label: 'Date of Birth', value: formatDate(player.dateOfBirth) },
                        { icon: 'calendar-outline', label: 'Registration', value: formatDate(player.registrationDate) },
                        { icon: 'calendar', label: 'Joining Year', value: player.joiningYear || (player.registrationDate ? new Date(player.registrationDate).getFullYear() : 'N/A') },
                    ].map(({ icon, label, value }) => (
                        <View key={label} style={[styles.infoRow, isGold && styles.goldInfoRow]}>
                            <View style={styles.infoLabel}>
                                <Ionicons name={icon} size={16} color={cardConfig.accent} />
                                <Text style={[styles.labelText, isGold && styles.goldText]}>{label}</Text>
                            </View>
                            <Text style={[styles.valueText, isGold && styles.goldValueText]}>{value}</Text>
                        </View>
                    ))}
                    <View style={[styles.infoRow, isGold && styles.goldInfoRow]}>
                        <View style={styles.infoLabel}>
                            <Ionicons name="information-circle" size={16} color={cardConfig.accent} />
                            <Text style={[styles.labelText, isGold && styles.goldText]}>Status</Text>
                        </View>
                        <Text style={[styles.valueText, {
                            color: player.status === 'accepted' ? '#4CAF50' : '#f39c12',
                            textTransform: 'uppercase', fontWeight: '900'
                        }]}>{player.status}</Text>
                    </View>
                    {player.accessPass && (
                        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                            <View style={styles.infoLabel}>
                                <Ionicons name="ticket" size={16} color={cardConfig.accent} />
                                <Text style={[styles.labelText, isGold && styles.goldText]}>Access Pass</Text>
                            </View>
                            <Text style={[styles.passText, isGold && styles.goldText]}>{player.accessPass}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.signatureBlock}>
                    <Image source={SIGNATURE_ASSET} style={styles.signatureImage} resizeMode="contain" />
                    <View style={[styles.signatureLine, isGold && styles.goldSignatureLine]} />
                    <Text style={styles.signatureLabel}>BIFA Secretary</Text>
                </View>
                <View style={[styles.cardFooter, isGold && styles.goldCardFooter]}>
                    <View style={[styles.footerLine, isGold && styles.goldFooterLine]} />
                    <Text style={styles.footerText}>BIFA Player Identification</Text>
                    <Text style={[styles.footerSubtext, isGold && styles.goldText]}>{cardConfig.passLabel}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { margin: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    downloadBtn: {
        backgroundColor: '#f4ea26', width: 40, height: 40, borderRadius: 20,
        justifyContent: 'center', alignItems: 'center', elevation: 3,
    },
    goldDownloadBtn: { backgroundColor: '#ffd76a' },
    typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    typeBtn: {
        flex: 1, minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(244,234,38,0.35)',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    typeBtnActive: { backgroundColor: '#f4ea26', borderColor: '#f4ea26' },
    goldTypeBtnActive: { backgroundColor: '#ffd76a', borderColor: '#ffd76a' },
    typeBtnText: { color: '#f4ea26', fontWeight: '800', fontSize: 12 },
    typeBtnTextActive: { color: '#0c0c0c' },
    idCard: {
        width: '100%', aspectRatio: 0.63, borderRadius: 16, overflow: 'hidden',
        elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, borderWidth: 2, borderColor: '#f4ea26',
    },
    goldIdCard: { borderColor: '#ffd76a', shadowColor: '#ffd76a' },
    goldSheen: {
        position: 'absolute', top: 0, right: -60, width: 150, height: '120%',
        backgroundColor: 'rgba(255,255,255,0.12)', transform: [{ rotate: '18deg' }],
    },
    cardHeader: {
        flexDirection: 'row',
        padding: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#f4ea26',
    },
    goldCardHeader: { borderBottomColor: '#ffd76a', backgroundColor: 'rgba(255,215,106,0.15)' },
    photoContainer: { marginRight: 15 },
    playerPhoto: { width: 80, height: 100, borderRadius: 8, borderWidth: 2, borderColor: '#f4ea26' },
    photoPlaceholder: {
        width: 80, height: 100, borderRadius: 8,
        backgroundColor: '#1a1a1a', borderWidth: 2, borderColor: '#f4ea26',
        justifyContent: 'center', alignItems: 'center',
    },
    headerInfo: { flex: 1, minWidth: 0, justifyContent: 'center' },
    goldHeaderInfo: {
        backgroundColor: 'rgba(255,215,106,0.32)',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    playerName: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4, flexShrink: 1 },
    goldPlayerName: { color: '#15110a' },
    playerPosition: { color: '#f4ea26', fontSize: 14, fontWeight: '600', marginBottom: 2 },
    playerCategory: { color: '#fff', fontSize: 12, opacity: 0.8 },
    goldPlayerCategory: { color: '#15110a', opacity: 0.85 },
    passLabel: { color: '#f4ea26', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.4, marginTop: 6 },
    cardBody: { flex: 1, padding: 20 },
    goldCardBody: { backgroundColor: 'rgba(255,215,106,0.08)' },
    infoRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 8, marginBottom: 8,
    },
    goldInfoRow: { borderBottomColor: 'rgba(255,215,106,0.16)' },
    infoLabel: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    labelText: { color: '#f4ea26', fontSize: 12, fontWeight: '600', marginLeft: 8, textTransform: 'uppercase' },
    goldLabelText: { color: '#1a1a1a' },
    valueText: { color: '#fff', fontSize: 12, fontWeight: '500', flex: 2, textAlign: 'right' },
    passText: { color: '#f4ea26', fontSize: 14, fontWeight: 'bold', letterSpacing: 1, flex: 2, textAlign: 'right' },
    goldValueText: { color: '#1a1a1a' },
    signatureBlock: { alignItems: 'flex-end', paddingHorizontal: 20, paddingBottom: 6, marginTop: 8 },
    signatureImage: { width: 120, height: 48 },
    signatureLine: { width: 110, height: 1, backgroundColor: 'rgba(244,234,38,0.5)', marginTop: -2, marginBottom: 4 },
    goldSignatureLine: { backgroundColor: '#ffd76a' },
    signatureLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.2 },
    cardFooter: { padding: 15, alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
    goldCardFooter: { borderTopColor: 'rgba(255,215,106,0.28)', backgroundColor: 'rgba(255,215,106,0.08)' },
    footerLine: { width: 50, height: 2, backgroundColor: '#f4ea26', marginBottom: 8 },
    footerText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
    footerSubtext: { color: '#f4ea26', fontSize: 8, marginTop: 2 },
    goldBorder: { borderColor: '#ffd76a' },
    goldText: { color: '#1a1a1a' },
    goldFooterLine: { backgroundColor: '#ffd76a' },
});

export default PlayerIdCard;
