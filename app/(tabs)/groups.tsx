import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useGroupStore } from '@/lib/stores/group-store';

export default function GroupsScreen() {
  const router = useRouter();
  const groupStore = useGroupStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    groupStore.loadGroups();
  }, []);

  const joinedGroups = groupStore.getJoinedGroups();
  const allGroups = groupStore.getAllGroups();
  
  // Filter groups based on search
  const filteredGroups = allGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleJoinGroup = (groupId: string) => {
    groupStore.joinGroup(groupId);
  };

  const handleCreateGroup = () => {
    router.push('./create-group');
  };

  const handleGroupPress = (groupId: string) => {
    router.push(`./groups/${groupId}`);
  };

  return (
    <ScreenContainer className="bg-background">
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-3xl font-bold text-foreground">Groups</Text>
          <Text className="text-sm text-muted mt-1">
            Join groups to stay accountable
          </Text>
        </View>

        {/* Search Bar */}
        <View className="px-6 pb-4">
          <TextInput
            className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            placeholder="Search groups..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Tabs */}
        <View className="flex-row border-b border-border px-6 gap-4">
          <TouchableOpacity className="py-3 border-b-2 border-primary">
            <Text className="font-semibold text-primary">All Groups</Text>
          </TouchableOpacity>
          <TouchableOpacity className="py-3">
            <Text className="font-semibold text-muted">My Groups</Text>
          </TouchableOpacity>
        </View>

        {/* Groups List */}
        <FlatList
          data={filteredGroups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16, gap: 12 }}
          renderItem={({ item }) => {
            const isJoined = joinedGroups.some(g => g.id === item.id);
            return (
              <TouchableOpacity
                className="bg-surface rounded-lg p-4 border border-border"
                onPress={() => handleGroupPress(item.id)}
                activeOpacity={0.7}
              >
                <View className="flex-row justify-between items-start gap-3">
                  <View className="flex-1">
                    <Text className="font-bold text-foreground text-base">{item.name}</Text>
                    <Text className="text-sm text-muted mt-1">{item.description}</Text>
                    <View className="flex-row gap-2 mt-3">
                      <View className="bg-primary/10 rounded px-2 py-1">
                        <Text className="text-xs font-semibold text-primary">
                          {item.memberCount} members
                        </Text>
                      </View>
                      {isJoined && (
                        <View className="bg-success/10 rounded px-2 py-1">
                          <Text className="text-xs font-semibold text-success">Joined</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {!isJoined && (
                    <TouchableOpacity
                      className="bg-primary rounded-lg px-4 py-2"
                      onPress={() => handleJoinGroup(item.id)}
                    >
                      <Text className="text-white font-semibold text-sm">Join</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text className="text-muted text-center">
                {searchQuery ? 'No groups found' : 'No groups available'}
              </Text>
            </View>
          }
        />

        {/* Create Group Button */}
        <View className="px-6 pb-6">
          <TouchableOpacity
            className="bg-primary rounded-lg py-4 items-center justify-center"
            onPress={handleCreateGroup}
          >
            <Text className="text-white font-bold text-base">Create New Group</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
