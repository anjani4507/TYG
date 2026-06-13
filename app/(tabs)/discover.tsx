/**
 * Group Discovery Screen
 * 
 * Browse and join focus groups by exam category
 */

import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import {
  getAllCategories,
  searchCategories,
  type ExamCategory,
} from '@/lib/_core/exam-categories';
import { useHapticFeedback } from '@/lib/_core/haptic-feedback';
import { router } from 'expo-router';

interface MockGroup {
  id: string;
  name: string;
  categoryId: string;
  memberCount: number;
  avgIntensity: number;
  description: string;
  isJoined: boolean;
}

// Mock groups data
const MOCK_GROUPS: MockGroup[] = [
  {
    id: 'group-1',
    name: 'JEE Mains 2026',
    categoryId: 'jee',
    memberCount: 342,
    avgIntensity: 0.82,
    description: 'Focused preparation for JEE Mains',
    isJoined: false,
  },
  {
    id: 'group-2',
    name: 'UPSC Prelims Study',
    categoryId: 'upsc',
    memberCount: 156,
    avgIntensity: 0.88,
    description: 'UPSC Civil Services preparation',
    isJoined: false,
  },
  {
    id: 'group-3',
    name: 'GATE CSE 2026',
    categoryId: 'gate',
    memberCount: 89,
    avgIntensity: 0.79,
    description: 'Computer Science GATE preparation',
    isJoined: false,
  },
  {
    id: 'group-4',
    name: 'NEET Biology Marathon',
    categoryId: 'neet',
    memberCount: 234,
    avgIntensity: 0.85,
    description: 'Biology focused study sessions',
    isJoined: false,
  },
  {
    id: 'group-5',
    name: 'CAT Quant Masters',
    categoryId: 'cat',
    memberCount: 78,
    avgIntensity: 0.81,
    description: 'Quantitative aptitude focused group',
    isJoined: false,
  },
];

export default function DiscoverScreen() {
  const colors = useColors();
  const haptic = useHapticFeedback();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [groups, setGroups] = useState(MOCK_GROUPS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState<string>('');

  const categories = getAllCategories();

  // Filter groups based on search and category
  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      const matchesSearch =
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || group.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [groups, searchQuery, selectedCategory]);

  const handleJoinGroup = (groupId: string) => {
    haptic.triggerSuccess();
    setGroups(
      groups.map((g) => (g.id === groupId ? { ...g, isJoined: true } : g))
    );
    Alert.alert('Joined!', 'You have successfully joined the group', [
      {
        text: 'View Group',
        onPress: () => router.push('/(tabs)/groups'),
      },
      {
        text: 'Continue Browsing',
      },
    ]);
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim() || !newGroupCategory) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    haptic.triggerSuccess();
    const newGroup: MockGroup = {
      id: `group-${Date.now()}`,
      name: newGroupName,
      categoryId: newGroupCategory,
      memberCount: 1,
      avgIntensity: 0.75,
      description: 'New study group',
      isJoined: true,
    };

    setGroups([newGroup, ...groups]);
    setShowCreateModal(false);
    setNewGroupName('');
    setNewGroupCategory('');

    Alert.alert('Group Created!', `${newGroupName} has been created`, [
      {
        text: 'View Group',
        onPress: () => router.push('/(tabs)/groups'),
      },
      {
        text: 'Continue',
      },
    ]);
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">
            Discover Groups
          </Text>
          <Text className="text-muted">
            Join a group and study together
          </Text>
        </View>

        {/* Search Bar */}
        <View className="mb-6">
          <TextInput
            className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            placeholder="Search groups..."
            placeholderTextColor="#9BA1A6"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Category Filter */}
        <View className="mb-6">
          <Text className="text-foreground font-semibold mb-3">Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
            <Pressable
              className={cn(
                'px-4 py-2 rounded-full border',
                !selectedCategory
                  ? 'bg-primary border-primary'
                  : 'bg-surface border-border'
              )}
              onPress={() => {
                setSelectedCategory(null);
                haptic.triggerSuccess();
              }}
            >
              <Text
                className={cn(
                  'font-semibold',
                  !selectedCategory ? 'text-background' : 'text-foreground'
                )}
              >
                All
              </Text>
            </Pressable>

            {categories.map((category) => (
              <Pressable
                key={category.id}
                className={cn(
                  'px-4 py-2 rounded-full border',
                  selectedCategory === category.id
                    ? 'bg-primary border-primary'
                    : 'bg-surface border-border'
                )}
                onPress={() => {
                  setSelectedCategory(category.id);
                  haptic.triggerSuccess();
                }}
              >
                <Text
                  className={cn(
                    'font-semibold text-sm',
                    selectedCategory === category.id
                      ? 'text-background'
                      : 'text-foreground'
                  )}
                >
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Groups List */}
        <View className="mb-6">
          <Text className="text-foreground font-semibold mb-3">
            {filteredGroups.length} Groups Found
          </Text>

          {filteredGroups.length === 0 ? (
            <View className="bg-surface rounded-lg p-6 items-center">
              <Text className="text-muted text-center">
                No groups found. Try a different search or create a new group!
              </Text>
            </View>
          ) : (
            <FlatList
              scrollEnabled={false}
              data={filteredGroups}
              keyExtractor={(item) => item.id}
              renderItem={({ item: group }) => (
                <View
                  key={group.id}
                  className="bg-surface rounded-lg p-4 mb-3 border border-border"
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-foreground">
                        {group.name}
                      </Text>
                      <Text className="text-muted text-sm">
                        {group.memberCount} members
                      </Text>
                    </View>
                    <View
                      className="px-3 py-1 rounded-full"
                      style={{
                        backgroundColor:
                          group.avgIntensity > 0.8
                            ? '#22C55E20'
                            : '#F59E0B20',
                      }}
                    >
                      <Text
                        className="font-semibold text-xs"
                        style={{
                          color:
                            group.avgIntensity > 0.8
                              ? '#22C55E'
                              : '#F59E0B',
                        }}
                      >
                        {Math.round(group.avgIntensity * 100)}% Intensity
                      </Text>
                    </View>
                  </View>

                  <Text className="text-muted text-sm mb-4">
                    {group.description}
                  </Text>

                  <Pressable
                    className={cn(
                      'py-2 px-4 rounded-lg items-center',
                      group.isJoined
                        ? 'bg-surface border border-border'
                        : 'bg-primary'
                    )}
                    onPress={() => {
                      if (!group.isJoined) {
                        handleJoinGroup(group.id);
                      }
                    }}
                  >
                    <Text
                      className={cn(
                        'font-semibold',
                        group.isJoined
                          ? 'text-foreground'
                          : 'text-background'
                      )}
                    >
                      {group.isJoined ? '✓ Joined' : 'Join Group'}
                    </Text>
                  </Pressable>
                </View>
              )}
            />
          )}
        </View>

        {/* Create Group Button */}
        <Pressable
          className="bg-primary rounded-lg py-4 items-center mt-auto"
          onPress={() => {
            setShowCreateModal(true);
            haptic.triggerSuccess();
          }}
        >
          <Text className="text-background font-semibold text-lg">
            + Create New Group
          </Text>
        </Pressable>
      </ScrollView>

      {/* Create Group Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6 pb-12">
            <Text className="text-2xl font-bold text-foreground mb-6">
              Create Group
            </Text>

            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground mb-4"
              placeholder="Group name..."
              placeholderTextColor="#9BA1A6"
              value={newGroupName}
              onChangeText={setNewGroupName}
            />

            <Text className="text-foreground font-semibold mb-2">Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-6 gap-2"
            >
              {categories.map((category) => (
                <Pressable
                  key={category.id}
                  className={cn(
                    'px-4 py-2 rounded-full border',
                    newGroupCategory === category.id
                      ? 'bg-primary border-primary'
                      : 'bg-surface border-border'
                  )}
                  onPress={() => {
                    setNewGroupCategory(category.id);
                  }}
                >
                  <Text
                    className={cn(
                      'font-semibold text-sm',
                      newGroupCategory === category.id
                        ? 'text-background'
                        : 'text-foreground'
                    )}
                  >
                    {category.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View className="gap-3">
              <Pressable
                className="bg-primary rounded-lg py-4 items-center"
                onPress={handleCreateGroup}
              >
                <Text className="text-background font-semibold text-lg">
                  Create Group
                </Text>
              </Pressable>

              <Pressable
                className="bg-surface border border-border rounded-lg py-4 items-center"
                onPress={() => setShowCreateModal(false)}
              >
                <Text className="text-foreground font-semibold">Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
