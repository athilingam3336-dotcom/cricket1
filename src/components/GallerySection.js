import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GALLERY_ITEMS } from '../data/cricketData';
import { getAsset } from '../utils/assets';

export default function GallerySection({ theme }) {
  const [activeItem, setActiveItem] = useState(null);

  return (
    <View style={styles.container}>
      <View style={styles.sectionHead}>
        <View style={[styles.sectionTag, { backgroundColor: 'rgba(212, 175, 55, 0.15)', borderColor: theme.primary }]}>
          <MaterialCommunityIcons name="camera" size={12} color={theme.primary} />
          <Text style={[styles.sectionTagText, { color: theme.primary }]}>VISUAL CHRONICLES</Text>
        </View>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>District Cricket Moments</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          Snapshots of passion, victory, and development across Virudhunagar cricket grounds
        </Text>
      </View>

      <View style={styles.galleryGrid}>
        {GALLERY_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.galleryItem, { borderColor: theme.border }]}
            onPress={() => setActiveItem(item)}
            activeOpacity={0.8}
          >
            <Image
              source={getAsset(item.imageKey)}
              style={styles.galleryImg}
              resizeMode="cover"
            />
            <View style={styles.overlay}>
              <MaterialCommunityIcons name="magnify-plus" size={16} color="#FFF" />
              <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.itemSub} numberOfLines={1}>{item.caption}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lightbox Modal */}
      {activeItem && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setActiveItem(null)}>
          <View style={styles.lightboxOverlay}>
            <TouchableOpacity style={styles.lightboxCloseBtn} onPress={() => setActiveItem(null)}>
              <MaterialCommunityIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.lightboxContent}>
              <Image
                source={getAsset(activeItem.imageKey)}
                style={styles.lightboxImg}
                resizeMode="contain"
              />
              <View style={styles.lightboxCaptionBox}>
                <Text style={styles.lightboxTitle}>{activeItem.title}</Text>
                <Text style={styles.lightboxCaption}>{activeItem.caption}</Text>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingTop: 16,
  },
  sectionHead: {
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
  },
  sectionTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 15,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  galleryItem: {
    width: '48.5%',
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  galleryImg: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: 8,
    justifyContent: 'flex-end',
  },
  itemTitle: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  itemSub: {
    color: '#E2E8F0',
    fontSize: 9.5,
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  lightboxContent: {
    width: '100%',
    alignItems: 'center',
  },
  lightboxImg: {
    width: '100%',
    height: 280,
    borderRadius: 10,
  },
  lightboxCaptionBox: {
    marginTop: 14,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  lightboxTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  lightboxCaption: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});
