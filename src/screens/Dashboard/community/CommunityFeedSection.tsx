// community/CommunityFeedSection.tsx
import React, { useState } from 'react';
import { View, FlatList } from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { PostComponent } from './PostComponent';
import type { Post } from './community.types';

type Props = {
  availableHeight: number;
};

export const CommunityFeedSection: React.FC<Props> = ({ availableHeight }) => {
  const { palette } = useTheme();
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '3',
      user: {
        id: 'user2',
        username: 'fitness_john',
        isVerified: true,
      },
      content: 'New personal record! Deadlift 180kg today. The grind never stops! 🔥',
      image: 'https://picsum.photos/400/300?random=3',
      likes: 89,
      comments: [
        { id: 'c1', author: 'Mike', text: 'Amazing work! 💪', userId: 'mike', timestamp: new Date().toISOString() },
        { id: 'c2', author: 'Sarah', text: 'So inspiring!', userId: 'sarah', timestamp: new Date().toISOString() },
        { id: 'c3', author: 'Tom', text: 'Incredible strength!', userId: 'tom', timestamp: new Date().toISOString() }
      ],
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      isLiked: false,
      type: 'achievement',
      metrics: {
        weight: 180,
      },
    },
    {
      id: '4',
      user: {
        id: 'user3',
        username: 'healthy_eater',
        isVerified: false,
      },
      content: 'Meal prep Sunday! Healthy, delicious, and ready for the week. Who else loves meal prepping?',
      image: 'https://picsum.photos/400/300?random=4',
      likes: 45,
      comments: [
        { id: 'c4', author: 'Lisa', text: 'Recipe please!', userId: 'lisa', timestamp: new Date().toISOString() },
        { id: 'c5', author: 'John', text: 'Looks amazing!', userId: 'john', timestamp: new Date().toISOString() }
      ],
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      isLiked: true,
      type: 'meal',
    },
    {
      id: '5',
      user: {
        id: 'user4',
        username: 'runner_girl',
        isVerified: true,
      },
      content: 'Morning 10k run with an amazing sunrise view. Nothing beats starting the day with a good run!',
      image: 'https://picsum.photos/400/300?random=5',
      likes: 67,
      comments: [
        { id: 'c6', author: 'Alex', text: 'Beautiful view!', userId: 'alex', timestamp: new Date().toISOString() },
        { id: 'c7', author: 'Emma', text: 'Great pace!', userId: 'emma', timestamp: new Date().toISOString() },
        { id: 'c8', author: 'Ryan', text: 'Motivational!', userId: 'ryan', timestamp: new Date().toISOString() }
      ],
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      isLiked: false,
      type: 'workout',
      metrics: {
        distance: 10,
        duration: 52,
        calories: 620,
      },
    },
    {
      id: '6',
      user: {
        id: 'user5',
        username: 'yoga_master',
        isVerified: false,
      },
      content: '30 days of yoga challenge completed! Flexibility and peace of mind achieved. 🧘‍♀️',
      image: 'https://picsum.photos/400/300?random=6',
      likes: 102,
      comments: [
        { id: 'c9', author: 'David', text: 'Congratulations!', userId: 'david', timestamp: new Date().toISOString() },
        { id: 'c10', author: 'Sophia', text: 'Inspirational!', userId: 'sophia', timestamp: new Date().toISOString() },
        { id: 'c11', author: 'Liam', text: 'Well done!', userId: 'liam', timestamp: new Date().toISOString() },
        { id: 'c12', author: 'Olivia', text: 'Amazing progress!', userId: 'olivia', timestamp: new Date().toISOString() }
      ],
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      isLiked: false,
      type: 'progress',
    },
  ]);

  const handleLike = (postId: string) => {
    setPosts(currentPosts =>
      currentPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const handleComment = (postId: string) => {
    console.log('Open comments for post:', postId);
  };

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: palette.background,
      height: availableHeight 
    }}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostComponent
            post={item}
            onLike={handleLike}
            onComment={handleComment}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};