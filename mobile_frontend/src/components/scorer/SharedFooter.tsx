import React from 'react';
import { View, Text, StyleSheet, Image, Platform, useWindowDimensions, TouchableOpacity } from 'react-native';

export default function SharedFooter() {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  return (
    <View style={styles.footerContainer}>
      <View style={[styles.footerGrid, isDesktop ? styles.footerGridDesktop : styles.footerGridMobile]}>
        
        {/* Brand Column */}
        <View style={styles.brandCol}>
          <View style={styles.brandHeader}>
            <Image 
              source={{ uri: Platform.OS === 'web' ? '/logo_transparent.png' : 'https://i.ibb.co/3sX8H3N/logo-transparent.png' }} 
              style={styles.logo} 
              resizeMode="contain"
            />
            <View>
              <Text style={styles.brandTitle}>Cricket Federation of Virudhunagar District</Text>
              <Text style={styles.brandMotto}>"Enjoy the game and chase your dreams"</Text>
            </View>
          </View>
          <Text style={styles.brandDesc}>
            The recognized governing cricket administration for Virudhunagar district. Dedicated to preserving the spirit of cricket, promoting collegiate competitions, and nurturing state and national champions.
          </Text>
          <View style={styles.affilTag}>
            <Text style={styles.affilText}>● Recognized District Cricket Governing Body</Text>
          </View>
        </View>

        {/* Links Column 1 */}
        <View style={styles.linksCol}>
          <Text style={styles.linksHeading}>MATCH CENTRE</Text>
          <TouchableOpacity><Text style={styles.linkText}>› Live Scores</Text></TouchableOpacity>
          <TouchableOpacity><Text style={styles.linkText}>› Season Fixtures</Text></TouchableOpacity>
          <TouchableOpacity><Text style={styles.linkText}>› Recent Results</Text></TouchableOpacity>
          <TouchableOpacity><Text style={styles.linkText}>› Standings & Points</Text></TouchableOpacity>
          <TouchableOpacity><Text style={styles.linkText}>› Player Performance</Text></TouchableOpacity>
        </View>

        {/* Links Column 2 */}
        <View style={styles.linksCol}>
          <Text style={styles.linksHeading}>OPERATIONS HUB</Text>
          <TouchableOpacity><Text style={styles.linkText}>› Admin Setup</Text></TouchableOpacity>
          <TouchableOpacity><Text style={styles.linkText}>› Clubs, Schools & Colleges</Text></TouchableOpacity>
          <TouchableOpacity><Text style={styles.linkText}>› Team Management</Text></TouchableOpacity>
          <TouchableOpacity><Text style={styles.linkText}>› Register Officials</Text></TouchableOpacity>
        </View>

        {/* Links Column 3 */}
        <View style={styles.linksCol}>
          <Text style={styles.linksHeading}>INTEGRITY & POLICIES</Text>
          <TouchableOpacity><Text style={styles.linkText}>› District League By-Laws</Text></TouchableOpacity>
          <TouchableOpacity><Text style={styles.linkText}>› Code of Conduct</Text></TouchableOpacity>
          <TouchableOpacity><Text style={styles.linkText}>› Player Registration</Text></TouchableOpacity>
          <TouchableOpacity><Text style={styles.linkText}>› College / Club Affiliation</Text></TouchableOpacity>
        </View>

      </View>

      <View style={styles.footerBottom}>
        <Text style={styles.bottomText}>© 2026 Cricket Federation of Virudhunagar District. All Rights Reserved.</Text>
        <View style={styles.bottomLinks}>
          <Text style={styles.bottomLink}>Privacy Policy</Text>
          <Text style={styles.bottomLink}>Terms of Use</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: '#040a1c',
    borderTopWidth: 2,
    borderTopColor: '#eab308',
    padding: 24,
    width: '100%'
  },
  footerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    marginBottom: 24
  },
  footerGridDesktop: {
    justifyContent: 'space-between'
  },
  footerGridMobile: {
    flexDirection: 'column'
  },
  brandCol: {
    flex: 1.5,
    minWidth: 280
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#eab308',
    backgroundColor: 'rgba(10, 27, 61, 0.98)'
  },
  brandTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
    flexWrap: 'wrap',
    maxWidth: 200
  },
  brandMotto: {
    color: '#fde047',
    fontStyle: 'italic',
    fontSize: 11,
    marginTop: 2
  },
  brandDesc: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16
  },
  affilTag: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
    padding: 6,
    borderRadius: 4,
    alignSelf: 'flex-start'
  },
  affilText: {
    color: '#eab308',
    fontSize: 11,
    fontWeight: 'bold'
  },
  linksCol: {
    flex: 1,
    minWidth: 150
  },
  linksHeading: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#eab308',
    paddingLeft: 8
  },
  linkText: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 8
  },
  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(234, 179, 8, 0.2)',
    paddingTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12
  },
  bottomText: {
    color: '#64748b',
    fontSize: 11
  },
  bottomLinks: {
    flexDirection: 'row',
    gap: 12
  },
  bottomLink: {
    color: '#64748b',
    fontSize: 11
  }
});
