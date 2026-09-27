import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NEWS_ARTICLES } from '../data/cricketData';
import { getAsset } from '../utils/assets';

export default function NewsSection({ theme }) {
  const [selectedArticle, setSelectedArticle] = useState(null);

  return (
    <View style={styles.container}>
      <View style={styles.sectionHead}>
        <View style={[styles.sectionTag, { backgroundColor: 'rgba(212, 175, 55, 0.15)', borderColor: theme.primary }]}>
          <MaterialCommunityIcons name="bullhorn" size={12} color={theme.primary} />
          <Text style={[styles.sectionTagText, { color: theme.primary }]}>MEDIA & CIRCULARS</Text>
        </View>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Latest News & Announcements</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          Official press releases, selection trial notices, and updates from the District Federation
        </Text>
      </View>

      <View style={styles.newsList}>
        {NEWS_ARTICLES.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.newsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => setSelectedArticle(item)}
            activeOpacity={0.8}
          >
            <Image
              source={getAsset(item.imageKey)}
              style={styles.newsImg}
              resizeMode="cover"
            />
            <View style={styles.newsContent}>
              <View style={styles.metaRow}>
                <View style={[styles.catBadge, { backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: '#3B82F6' }]}>
                  <Text style={[styles.catBadgeText, { color: '#60A5FA' }]}>{item.cat}</Text>
                </View>
                <Text style={[styles.dateText, { color: theme.textMuted }]}>{item.date}</Text>
              </View>

              <Text style={[styles.newsTitle, { color: theme.text }]} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={[styles.newsExcerpt, { color: theme.textSecondary }]} numberOfLines={2}>
                {item.excerpt}
              </Text>

              <View style={styles.readMoreRow}>
                <Text style={[styles.readMoreText, { color: theme.primary }]}>Read Full Circular</Text>
                <MaterialCommunityIcons name="arrow-right" size={13} color={theme.primary} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <Modal visible={true} animationType="slide" transparent onRequestClose={() => setSelectedArticle(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.borderLight }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalCat, { color: theme.primary }]}>{selectedArticle.cat}</Text>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedArticle.title}</Text>
                  <Text style={[styles.modalDate, { color: theme.textMuted }]}>{selectedArticle.date}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedArticle(null)} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={20} color={theme.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <Image
                  source={getAsset(selectedArticle.imageKey)}
                  style={styles.modalImg}
                  resizeMode="cover"
                />
                <Text style={[styles.modalFullText, { color: theme.text }]}>
                  {selectedArticle.text}
                </Text>
              </ScrollView>

              <View style={[styles.modalFooter, { borderTopColor: theme.borderLight }]}>
                <TouchableOpacity
                  style={[styles.closeModalBtn, { backgroundColor: theme.primary }]}
                  onPress={() => setSelectedArticle(null)}
                >
                  <Text style={styles.closeModalBtnText}>Close Circular</Text>
                </TouchableOpacity>
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
  newsList: {
    gap: 12,
  },
  newsCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  newsImg: {
    width: '100%',
    height: 130,
  },
  newsContent: {
    padding: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  catBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  catBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  dateText: {
    fontSize: 10,
  },
  newsTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
    lineHeight: 17,
  },
  newsExcerpt: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readMoreText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalCat: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 2,
  },
  modalDate: {
    fontSize: 10.5,
  },
  closeBtn: {
    padding: 6,
  },
  modalBody: {
    padding: 16,
  },
  modalImg: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 12,
  },
  modalFullText: {
    fontSize: 12.5,
    lineHeight: 19,
    marginBottom: 16,
  },
  modalFooter: {
    padding: 12,
    borderTopWidth: 1,
  },
  closeModalBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeModalBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 12,
  },
});
