import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const buildHtml = (player) => {
    const statusColor =
        player.status === 'accepted' ? '#4CAF50' :
        player.status === 'declined' ? '#F44336' : '#f39c12';

    const photoHtml = player.profilePhoto
        ? `<img src="${player.profilePhoto}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" />`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;">👤</div>`;

    const accessPassHtml = player.accessPass ? `
        <div class="info-row" style="border-bottom:none;">
            <div class="info-label">🎫 <span>Access Pass</span></div>
            <div style="color:#f4ea26;font-size:15px;font-weight:bold;letter-spacing:1px;text-align:right;flex:2;">${player.accessPass}</div>
        </div>` : '';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #f0f0f0;
    font-family: Arial, sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 20px;
  }
  .id-card {
    width: 400px;
    background: #0c0c0c;
    border-radius: 16px;
    border: 2.5px solid #f4ea26;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    color: white;
  }
  .card-header {
    display: flex;
    flex-direction: row;
    padding: 20px;
    border-bottom: 2px solid #f4ea26;
    background: linear-gradient(180deg, #1a1a1a, #0c0c0c);
    gap: 15px;
  }
  .player-photo {
    width: 80px;
    height: 100px;
    border-radius: 8px;
    border: 2px solid #f4ea26;
    background: #1a1a1a;
    overflow: hidden;
    flex-shrink: 0;
  }
  .header-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
  }
  .player-name  { color: #fff;    font-size: 20px; font-weight: 900; letter-spacing: 0.5px; }
  .player-pos   { color: #f4ea26; font-size: 14px; font-weight: bold; }
  .player-cat   { color: #aaa;    font-size: 12px; }
  .card-body    { padding: 18px 20px; }
  .info-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    padding: 10px 0;
  }
  .info-label {
    display: flex;
    align-items: center;
    color: #f4ea26;
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    flex: 1;
    gap: 8px;
  }
  .value-text {
    color: #fff;
    font-size: 12px;
    font-weight: 500;
    text-align: right;
    flex: 2;
  }
  .card-footer {
    padding: 14px 20px;
    text-align: center;
    border-top: 1px solid rgba(255,255,255,0.1);
    background: #0c0c0c;
  }
  .footer-line {
    width: 50px;
    height: 2px;
    background: #f4ea26;
    margin: 0 auto 8px;
  }
  .footer-text    { color: #fff;    font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
  .footer-subtext { color: #f4ea26; font-size: 9px; margin-top: 3px; }
</style>
</head>
<body>
  <div class="id-card">
    <div class="card-header">
      <div class="player-photo">${photoHtml}</div>
      <div class="header-info">
        <div class="player-name">${player.fullName}</div>
        <div class="player-pos">${player.positions.join(' • ')}</div>
        <div class="player-cat">${player.ageCategory || 'U20'}</div>
      </div>
    </div>
    <div class="card-body">
      <div class="info-row">
        <div class="info-label">📧 Email</div>
        <div class="value-text">${player.email}</div>
      </div>
      <div class="info-row">
        <div class="info-label">📞 Phone</div>
        <div class="value-text">${player.phone}</div>
      </div>
      <div class="info-row">
        <div class="info-label">📅 Date of Birth</div>
        <div class="value-text">${formatDate(player.dateOfBirth)}</div>
      </div>
      <div class="info-row">
        <div class="info-label">📅 Registration</div>
        <div class="value-text">${formatDate(player.registrationDate)}</div>
      </div>
      <div class="info-row">
        <div class="info-label">📅 Joining Year</div>
        <div class="value-text">${player.joiningYear || new Date(player.registrationDate).getFullYear()}</div>
      </div>
      <div class="info-row">
        <div class="info-label">ℹ️ Status</div>
        <div class="value-text" style="color:${statusColor};font-weight:900;text-transform:uppercase;">${player.status}</div>
      </div>
      ${accessPassHtml}
    </div>
    <div class="card-footer">
      <div class="footer-line"></div>
      <div class="footer-text">BIFA Player Identification</div>
      <div class="footer-subtext">Valid ID Card</div>
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

            // Generate a real PDF from the HTML
            const { uri } = await Print.printToFileAsync({
                html: buildHtml(player),
                base64: false,
            });

            // Check if sharing is available (it always is on a real device)
            const canShare = await Sharing.isAvailableAsync();
            if (!canShare) {
                Alert.alert('Unavailable', 'Sharing is not available on this device.');
                return;
            }

            // Open the native share sheet — user can save to Files, print, WhatsApp, etc.
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

            {/* Visual card — unchanged from your original */}
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
                        { icon: 'mail',               label: 'Email',        value: player.email },
                        { icon: 'call',               label: 'Phone',        value: player.phone },
                        { icon: 'calendar',           label: 'Date of Birth',value: formatDate(player.dateOfBirth) },
                        { icon: 'calendar-outline',   label: 'Registration', value: formatDate(player.registrationDate) },
                        { icon: 'calendar',           label: 'Joining Year', value: player.joiningYear || new Date(player.registrationDate).getFullYear() },
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
                            color: player.status === 'accepted' ? '#4CAF50' :
                                   player.status === 'declined' ? '#F44336' : '#f39c12',
                            textTransform: 'uppercase',
                            fontWeight: '900'
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
        backgroundColor: '#f4ea26',
        width: 40, height: 40, borderRadius: 20,
        justifyContent: 'center', alignItems: 'center', elevation: 3,
    },
    idCard: {
        width: '100%', aspectRatio: 0.63,
        borderRadius: 16, overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8,
        borderWidth: 2, borderColor: '#f4ea26',
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
    cardFooter: { padding: 15, alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
    footerLine: { width: 50, height: 2, backgroundColor: '#f4ea26', marginBottom: 8 },
    footerText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
    footerSubtext: { color: '#f4ea26', fontSize: 8, marginTop: 2 },
});

export default PlayerIdCard;