import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

const SIGNATURE_ASSET = require('../../assets/images/signbifa.png');

const formatDate = (dateString) => {
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

const getAssetBase64 = async (assetModule, label) => {
    try {
        const asset = Asset.fromModule(assetModule);
        await asset.downloadAsync();
        const assetUri = asset.localUri || asset.uri;
        if (!assetUri) {
            throw new Error(`No URI available for ${label}`);
        }

        try {
            if (Platform.OS === 'web') {
                const dataUrl = await fetchUriAsBase64(assetUri);
                console.log(`${label} loaded successfully for web`);
                return dataUrl;
            }

            const base64 = await FileSystem.readAsStringAsync(assetUri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            const dataUrl = `data:image/png;base64,${base64}`;
            console.log(`${label} loaded successfully for native`);
            return dataUrl;
        } catch (readError) {
            console.warn(`FileSystem read failed for ${label}, trying fetch:`, readError);
            return await fetchUriAsBase64(assetUri);
        }
    } catch (e) {
        console.error(`Failed to load ${label}:`, e);
        return null;
    }
};

const buildHtml = (player, signatureBase64) => {
    const statusColor = player.status === 'accepted' ? '#4CAF50' : '#f39c12';

    const photoHtml = player.profilePhoto
        ? `<img src="${player.profilePhoto}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" />`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#1a1a1a;">
             <svg width="40" height="40" viewBox="0 0 24 24" fill="#f4ea26"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
           </div>`;

    const accessPassHtml = player.accessPass ? `
      <div style="margin:10px 0 0;border-radius:6px;border:1.5px solid #f4ea26;background:rgba(244,234,38,0.08) !important;padding:10px 14px;display:flex;flex-direction:row;justify-content:space-between;align-items:center;">
        <span style="color:#f4ea26;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Access Pass</span>
        <span style="color:#f4ea26;font-size:15px;font-weight:900;letter-spacing:2px;">${player.accessPass}</span>
      </div>` : '';

    const row = (label, value, color = '#ffffff') =>
        `<div style="display:flex;flex-direction:row;justify-content:space-between;align-items:center;padding:8px 0 8px 12px;border-bottom:1px solid rgba(244,234,38,0.12);border-left:3px solid #f4ea26;margin-bottom:4px;">
           <span style="color:#f4ea26;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.8px;flex:1;">${label}</span>
           <span style="color:${color};font-size:12px;font-weight:${color === '#ffffff' ? '500' : '900'};text-align:right;flex:2;">${value}</span>
         </div>`;

    const frontBgSvg = `
      <svg width="400" height="640" viewBox="0 0 400 640" preserveAspectRatio="xMidYMid slice"
           style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;">
        <rect x="0" y="0" width="200" height="175" fill="#f4ea26" opacity="0.08"/>
        <rect x="200" y="0" width="200" height="175" fill="#000000" opacity="0.4"/>
        <line x1="-10" y1="40"  x2="80"  y2="-10" stroke="#f4ea26" stroke-width="0.6" opacity="0.15"/>
        <line x1="-10" y1="70"  x2="110" y2="-10" stroke="#f4ea26" stroke-width="0.6" opacity="0.15"/>
        <line x1="-10" y1="100" x2="140" y2="-10" stroke="#f4ea26" stroke-width="0.6" opacity="0.15"/>
        <polyline points="0,220 40,260 10,300 55,340 20,380 60,410 30,440 70,470 0,520" fill="none" stroke="#f4ea26" stroke-width="12" stroke-linejoin="round" stroke-linecap="round" opacity="0.12"/>
        <polyline points="400,240 360,280 390,320 345,360 380,400 340,430 370,460 330,490 400,540" fill="none" stroke="#f4ea26" stroke-width="12" stroke-linejoin="round" stroke-linecap="round" opacity="0.12"/>
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
    <div style="width:400px;height:640px;background:#0c0c0c !important;border-radius:16px;border:2.5px solid #f4ea26;overflow:hidden;color:white;position:relative;">

      ${frontBgSvg}

      <div style="position:relative;z-index:1; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
        
        <div style="display:flex;flex-direction:row;border-bottom:2.5px solid #f4ea26;overflow:hidden;">
          <div style="background:rgba(244,234,38,0.12) !important;padding:18px 14px 18px 18px;display:flex;align-items:center;justify-content:center;border-right:1.5px solid #f4ea26;">
            <div style="width:80px;height:100px;border-radius:8px;border:2px solid #f4ea26;overflow:hidden;background:#1a1a1a !important;">
              ${photoHtml}
            </div>
          </div>
          <div style="flex:1;padding:18px 16px;background:rgba(0,0,0,0.5) !important;display:flex;flex-direction:column;justify-content:center;gap:6px;">
            <div style="color:#fff;font-size:18px;font-weight:900;letter-spacing:0.5px;line-height:1.2;">${player.fullName}</div>
            <div style="color:#f4ea26;font-size:13px;font-weight:bold;letter-spacing:0.5px;">${player.positions.join(' \u2022 ')}</div>
            <div style="display:inline-block;background:#f4ea26 !important;color:#000;font-size:10px;font-weight:900;padding:2px 8px;border-radius:4px;letter-spacing:1px;align-self:flex-start;">${player.ageCategory || 'U20'}</div>
          </div>
        </div>

        <div style="padding:14px 18px 12px; background:rgba(0,0,0,0.6) !important; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
          
          <div>
            ${row('Email', player.email)}
            ${row('Phone', player.phone)}
            ${row('Date of Birth', formatDate(player.dateOfBirth))}
            ${row('Registration', formatDate(player.registrationDate))}
            ${row('Joining Year', String(player.joiningYear || new Date(player.registrationDate).getFullYear()))}
            ${row('Status', player.status.toUpperCase(), statusColor)}
            ${accessPassHtml}
          </div>
          
          <div style="display: flex; flex-direction: column; align-items: flex-end; padding-right: 10px; margin-top: 24px; margin-bottom: 0;">
            ${signatureBase64
                ? `<img src="${signatureBase64}" style="width:120px;height:48px;object-fit:contain;margin-bottom:-3px;" />`
                : `<div style="width:120px;height:48px;"></div>`
            }
            <div style="width: 110px; height: 1px; background: rgba(244,234,38,0.5) !important; margin-bottom: 4px;"></div>
            <div style="color: rgba(255,255,255,0.6); font-size: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.2px;">
              BIFA Secretary
            </div>
          </div>

        </div>

        <div style="padding:12px 18px;display:flex;flex-direction:row;justify-content:space-between;align-items:center;border-top:2px solid #f4ea26;background:rgba(244,234,38,0.07) !important;">
          <div style="color:#f4ea26;font-size:14px;font-weight:900;letter-spacing:3px;">BIFA</div>
          <div style="text-align:right;">
            <div style="color:#fff;font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;">Player Identification</div>
            <div style="color:#f4ea26;font-size:8px;letter-spacing:1px;margin-top:2px;">Valid ID Card</div>
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

    const handleDownload = async () => {
        try {
            setDownloading(true);
            console.log('Starting PDF generation...');
            const signatureBase64 = await getAssetBase64(SIGNATURE_ASSET, 'signature');
            console.log('Signature loaded:', signatureBase64 ? 'YES' : 'NO');
            
            const html = buildHtml(player, signatureBase64);
            console.log('HTML built, generating PDF...');
            
            const { uri } = await Print.printToFileAsync({
                html,
                base64: false,
                width: 440,
                height: 700,
            });

            console.log('PDF generated at:', uri);
            const isWeb = Platform.OS === 'web';
            const canShare = !isWeb && await Sharing.isAvailableAsync();

            if (isWeb) {
                const link = document.createElement('a');
                link.href = uri;
                link.download = `${player.fullName} - BIFA ID Card.pdf`;
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
                dialogTitle: `${player.fullName} – BIFA ID Card`,
                UTI: 'com.adobe.pdf',
            });
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Error', 'Failed to generate ID card. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Player ID Card</Text>
                <TouchableOpacity
                    style={[styles.downloadBtn, downloading && { opacity: 0.7 }]}
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

            <View style={styles.idCard}>
                <LinearGradient colors={['#1a1a1a', '#0c0c0c']} style={StyleSheet.absoluteFillObject} />
                <View style={styles.cardHeader}>
                    <View style={styles.photoContainer}>
                        {player.profilePhoto ? (
                            <Image source={{ uri: player.profilePhoto }} style={styles.playerPhoto} />
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <Ionicons name="person" size={40} color="#f4ea26" />
                            </View>
                        )}
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.playerName}>{player.fullName}</Text>
                        <Text style={styles.playerPosition}>{player.positions.join(' • ')}</Text>
                        <Text style={styles.playerCategory}>{player.ageCategory || 'U20'}</Text>
                    </View>
                </View>
                <View style={styles.cardBody}>
                    {[
                        { icon: 'mail',             label: 'Email',         value: player.email },
                        { icon: 'call',             label: 'Phone',         value: player.phone },
                        { icon: 'calendar',         label: 'Date of Birth', value: formatDate(player.dateOfBirth) },
                        { icon: 'calendar-outline', label: 'Registration',  value: formatDate(player.registrationDate) },
                        { icon: 'calendar',         label: 'Joining Year',  value: player.joiningYear || new Date(player.registrationDate).getFullYear() },
                    ].map(({ icon, label, value }) => (
                        <View key={label} style={styles.infoRow}>
                            <View style={styles.infoLabel}>
                                <Ionicons name={icon} size={16} color="#f4ea26" />
                                <Text style={styles.labelText}>{label}</Text>
                            </View>
                            <Text style={styles.valueText}>{value}</Text>
                        </View>
                    ))}
                    <View style={styles.infoRow}>
                        <View style={styles.infoLabel}>
                            <Ionicons name="information-circle" size={16} color="#f4ea26" />
                            <Text style={styles.labelText}>Status</Text>
                        </View>
                        <Text style={[styles.valueText, {
                            color: player.status === 'accepted' ? '#4CAF50' : '#f39c12',
                            textTransform: 'uppercase', fontWeight: '900'
                        }]}>{player.status}</Text>
                    </View>
                    {player.accessPass && (
                        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                            <View style={styles.infoLabel}>
                                <Ionicons name="ticket" size={16} color="#f4ea26" />
                                <Text style={styles.labelText}>Access Pass</Text>
                            </View>
                            <Text style={styles.passText}>{player.accessPass}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.signatureBlock}>
                    <Image source={SIGNATURE_ASSET} style={styles.signatureImage} resizeMode="contain" />
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureLabel}>BIFA Secretary</Text>
                </View>
                <View style={styles.cardFooter}>
                    <View style={styles.footerLine} />
                    <Text style={styles.footerText}>BIFA Player Identification</Text>
                    <Text style={styles.footerSubtext}>Valid ID Card</Text>
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
    idCard: {
        width: '100%', aspectRatio: 0.63, borderRadius: 16, overflow: 'hidden',
        elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, borderWidth: 2, borderColor: '#f4ea26',
    },
    cardHeader: { flexDirection: 'row', padding: 20, borderBottomWidth: 2, borderBottomColor: '#f4ea26' },
    photoContainer: { marginRight: 15 },
    playerPhoto: { width: 80, height: 100, borderRadius: 8, borderWidth: 2, borderColor: '#f4ea26' },
    photoPlaceholder: {
        width: 80, height: 100, borderRadius: 8,
        backgroundColor: '#1a1a1a', borderWidth: 2, borderColor: '#f4ea26',
        justifyContent: 'center', alignItems: 'center',
    },
    headerInfo: { flex: 1, justifyContent: 'center' },
    playerName: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    playerPosition: { color: '#f4ea26', fontSize: 14, fontWeight: '600', marginBottom: 2 },
    playerCategory: { color: '#fff', fontSize: 12, opacity: 0.8 },
    cardBody: { flex: 1, padding: 20 },
    infoRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 8, marginBottom: 8,
    },
    infoLabel: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    labelText: { color: '#f4ea26', fontSize: 12, fontWeight: '600', marginLeft: 8, textTransform: 'uppercase' },
    valueText: { color: '#fff', fontSize: 12, fontWeight: '500', flex: 2, textAlign: 'right' },
    passText: { color: '#f4ea26', fontSize: 14, fontWeight: 'bold', letterSpacing: 1, flex: 2, textAlign: 'right' },
    signatureBlock: { alignItems: 'flex-end', paddingHorizontal: 20, paddingBottom: 6, marginTop: 8 },
    signatureImage: { width: 120, height: 48 },
    signatureLine: { width: 110, height: 1, backgroundColor: 'rgba(244,234,38,0.5)', marginTop: -2, marginBottom: 4 },
    signatureLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.2 },
    cardFooter: { padding: 15, alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
    footerLine: { width: 50, height: 2, backgroundColor: '#f4ea26', marginBottom: 8 },
    footerText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
    footerSubtext: { color: '#f4ea26', fontSize: 8, marginTop: 2 },
});

export default PlayerIdCard;
