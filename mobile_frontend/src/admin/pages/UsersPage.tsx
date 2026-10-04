/**
 * src/admin/pages/UsersPage.tsx
 * Users Management Page for Cricket Association Professional Admin Panel.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import PageHeader from '../components/PageHeader';
import DataTable, { ColumnDef } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import { EditIcon, CheckIcon, CloseIcon, EyeIcon } from '../components/Icons';
import { adminApi } from '../services/adminApi';
import { useAdminLayout } from '../components/AdminLayout';

export const UsersPage: React.FC = () => {
  const { showToast } = useAdminLayout();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Edit / View Modal
  const [activeUser, setActiveUser] = useState<any | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editRole, setEditRole] = useState('USER');
  const [editStatus, setEditStatus] = useState('ACTIVE');

  // Confirm Status Toggle
  const [confirmToggle, setConfirmToggle] = useState<{
    visible: boolean;
    user: any;
    targetStatus: string;
  }>({
    visible: false,
    user: null,
    targetStatus: ''
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined
      });
      if (res && res.success) {
        setUsers(res.users || []);
      }
    } catch (e: any) {
      showToast(`Failed to load users: ${e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  const handleOpenView = (user: any) => {
    setActiveUser(user);
    setIsEditMode(false);
  };

  const handleOpenEdit = (user: any) => {
    setActiveUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditMobile(user.mobile || '');
    setEditRole(user.role);
    setEditStatus(user.status || 'ACTIVE');
    setIsEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editEmail.trim()) {
      showToast('Name and Email are required.', 'error');
      return;
    }
    try {
      await adminApi.updateUser(activeUser.id, {
        name: editName.trim(),
        email: editEmail.trim(),
        mobile: editMobile.trim(),
        role: editRole,
        status: editStatus
      });
      showToast('User record updated successfully.', 'success');
      setActiveUser(null);
      loadUsers();
    } catch (err: any) {
      showToast(`Update error: ${err.message}`, 'error');
    }
  };

  const handleConfirmStatusToggle = async () => {
    const { user, targetStatus } = confirmToggle;
    setConfirmToggle(prev => ({ ...prev, visible: false }));
    try {
      await adminApi.updateUserStatus(user.id, targetStatus);
      showToast(`User status set to ${targetStatus}.`, 'success');
      loadUsers();
    } catch (err: any) {
      showToast(`Status update failed: ${err.message}`, 'error');
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      width: 220,
      render: item => (
        <View>
          <Text style={styles.userNameText}>{item.name}</Text>
          <Text style={styles.userIdSub}>{item.id}</Text>
        </View>
      )
    },
    {
      key: 'email',
      header: 'Email / Contact',
      sortable: true,
      width: 240,
      render: item => (
        <View>
          <Text style={styles.userEmailText}>{item.email}</Text>
          {item.mobile && <Text style={styles.userMobileSub}>📱 {item.mobile}</Text>}
        </View>
      )
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      width: 140,
      render: item => (
        <View
          style={[
            styles.rolePill,
            item.role === 'ADMIN' && styles.roleAdmin,
            item.role === 'SCORER' && styles.roleScorer,
            item.role === 'PLAYER' && styles.rolePlayer
          ]}
        >
          <Text style={styles.rolePillText}>{item.role}</Text>
        </View>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: 130,
      render: item => <StatusBadge status={item.status || 'ACTIVE'} size="sm" />
    },
    {
      key: 'created_at',
      header: 'Registered Date',
      sortable: true,
      width: 150,
      render: item => (
        <Text style={styles.dateText}>
          {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
        </Text>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      width: 160,
      render: item => (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleOpenView(item)}
            accessibilityLabel="View Details"
          >
            <EyeIcon size={14} color="#0f2452" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleOpenEdit(item)}
            accessibilityLabel="Edit User"
          >
            <EditIcon size={14} color="#2563eb" />
          </TouchableOpacity>
          {item.status === 'ACTIVE' ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnDanger]}
              onPress={() =>
                setConfirmToggle({
                  visible: true,
                  user: item,
                  targetStatus: 'INACTIVE'
                })
              }
              accessibilityLabel="Deactivate Account"
            >
              <CloseIcon size={14} color="#dc2626" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnSuccess]}
              onPress={() =>
                setConfirmToggle({
                  visible: true,
                  user: item,
                  targetStatus: 'ACTIVE'
                })
              }
              accessibilityLabel="Activate Account"
            >
              <CheckIcon size={14} color="#059669" />
            </TouchableOpacity>
          )}
        </View>
      )
    }
  ];

  return (
    <View style={styles.container}>
      <PageHeader
        title="Users Management"
        subtitle="View, filter, edit, and control account permissions for federation portal users."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Users' }]}
      />

      {/* Role Filter Tabs */}
      <View style={styles.filtersBar}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Role:</Text>
          {['ALL', 'ADMIN', 'SCORER', 'PLAYER', 'USER'].map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.filterChip, roleFilter === r && styles.filterChipActive]}
              onPress={() => setRoleFilter(r)}
            >
              <Text style={[styles.filterChipText, roleFilter === r && styles.filterChipTextActive]}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Status:</Text>
          {['ALL', 'ACTIVE', 'INACTIVE'].map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
              onPress={() => setStatusFilter(s)}
            >
              <Text style={[styles.filterChipText, statusFilter === s && styles.filterChipTextActive]}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Users DataTable */}
      <DataTable
        data={users}
        columns={columns}
        keyExtractor={item => item.id}
        loading={loading}
        searchPlaceholder="Search by name, email, or mobile..."
        searchFields={['name', 'email', 'mobile', 'role']}
        emptyTitle="No users found"
        emptyDescription="No registered users match the specified search or filter criteria."
      />

      {/* View / Edit Modal */}
      {activeUser && (
        <Modal visible={Boolean(activeUser)} transparent animationType="fade" onRequestClose={() => setActiveUser(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalDialog}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {isEditMode ? 'Edit User Record' : 'User Details'}
                </Text>
                <TouchableOpacity onPress={() => setActiveUser(null)}>
                  <CloseIcon size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              {isEditMode ? (
                <View style={styles.modalBody}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Full Name</Text>
                    <TextInput style={styles.fieldInput} value={editName} onChangeText={setEditName} />
                  </View>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Email Address</Text>
                    <TextInput style={styles.fieldInput} value={editEmail} onChangeText={setEditEmail} keyboardType="email-address" />
                  </View>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Mobile Number</Text>
                    <TextInput style={styles.fieldInput} value={editMobile} onChangeText={setEditMobile} keyboardType="phone-pad" />
                  </View>
                  <View style={styles.fieldRow}>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>Role</Text>
                      <View style={styles.roleSelectRow}>
                        {['ADMIN', 'SCORER', 'PLAYER', 'USER'].map(r => (
                          <TouchableOpacity
                            key={r}
                            style={[styles.roleSelectChip, editRole === r && styles.roleSelectChipActive]}
                            onPress={() => setEditRole(r)}
                          >
                            <Text style={[styles.roleSelectText, editRole === r && styles.roleSelectTextActive]}>{r}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Account Status</Text>
                    <View style={styles.roleSelectRow}>
                      {['ACTIVE', 'INACTIVE'].map(s => (
                        <TouchableOpacity
                          key={s}
                          style={[styles.roleSelectChip, editStatus === s && styles.roleSelectChipActive]}
                          onPress={() => setEditStatus(s)}
                        >
                          <Text style={[styles.roleSelectText, editStatus === s && styles.roleSelectTextActive]}>{s}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.modalBody}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoKey}>User ID:</Text>
                    <Text style={styles.infoVal}>{activeUser.id}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoKey}>Name:</Text>
                    <Text style={styles.infoVal}>{activeUser.name}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoKey}>Email:</Text>
                    <Text style={styles.infoVal}>{activeUser.email}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoKey}>Mobile:</Text>
                    <Text style={styles.infoVal}>{activeUser.mobile || 'Not specified'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoKey}>Role:</Text>
                    <Text style={styles.infoVal}>{activeUser.role}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoKey}>Status:</Text>
                    <StatusBadge status={activeUser.status || 'ACTIVE'} size="sm" />
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoKey}>Created Date:</Text>
                    <Text style={styles.infoVal}>
                      {activeUser.created_at ? new Date(activeUser.created_at).toLocaleString() : 'N/A'}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.modalFooter}>
                {isEditMode ? (
                  <>
                    <TouchableOpacity style={styles.btnCancel} onPress={() => setIsEditMode(false)}>
                      <Text style={styles.btnCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnSave} onPress={handleSaveEdit}>
                      <Text style={styles.btnSaveText}>Save Changes</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity style={styles.btnCancel} onPress={() => setActiveUser(null)}>
                      <Text style={styles.btnCancelText}>Close</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnSave} onPress={() => handleOpenEdit(activeUser)}>
                      <Text style={styles.btnSaveText}>Edit User</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Status Toggle Confirmation */}
      <ConfirmDialog
        visible={confirmToggle.visible}
        title={confirmToggle.targetStatus === 'ACTIVE' ? 'Activate User' : 'Deactivate User'}
        message={`Are you sure you want to change status to "${confirmToggle.targetStatus}" for ${confirmToggle.user?.name}?`}
        variant={confirmToggle.targetStatus === 'ACTIVE' ? 'success' : 'danger'}
        confirmText={confirmToggle.targetStatus === 'ACTIVE' ? 'Activate' : 'Deactivate'}
        onConfirm={handleConfirmStatusToggle}
        onCancel={() => setConfirmToggle(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  filtersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 20,
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap'
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b'
  },
  filterChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  filterChipActive: {
    backgroundColor: '#0f2452',
    borderColor: '#0f2452'
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569'
  },
  filterChipTextActive: {
    color: '#ffffff'
  },
  userNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a'
  },
  userIdSub: {
    fontSize: 11,
    color: '#94a3b8'
  },
  userEmailText: {
    fontSize: 12.5,
    color: '#334155'
  },
  userMobileSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  rolePill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    alignSelf: 'flex-start'
  },
  roleAdmin: {
    backgroundColor: '#fef3c7'
  },
  roleScorer: {
    backgroundColor: '#e0e7ff'
  },
  rolePlayer: {
    backgroundColor: '#dcfce7'
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155'
  },
  dateText: {
    fontSize: 12,
    color: '#64748b'
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionBtnDanger: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2'
  },
  actionBtnSuccess: {
    borderColor: '#a7f3d0',
    backgroundColor: '#ecfdf5'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalDialog: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a'
  },
  modalBody: {
    marginBottom: 20
  },
  fieldGroup: {
    marginBottom: 14
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6
  },
  fieldInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#f8fafc'
  },
  roleSelectRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap'
  },
  roleSelectChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc'
  },
  roleSelectChipActive: {
    backgroundColor: '#0f2452',
    borderColor: '#0f2452'
  },
  roleSelectText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  roleSelectTextActive: {
    color: '#ffffff'
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc'
  },
  infoKey: {
    width: 120,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748b'
  },
  infoVal: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600'
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10
  },
  btnCancel: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  btnCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569'
  },
  btnSave: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#0f2452'
  },
  btnSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff'
  }
});

export default UsersPage;
