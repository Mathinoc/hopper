import { View, Text, TextInput, StyleSheet } from 'react-native';
import React, { useState, useCallback, useEffect } from 'react';
import io from 'socket.io-client';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { FlatList } from 'react-native-gesture-handler';
import { useUser } from '../context/UserContext';
import { SERVERURL } from '../utils/index.utils';

const socket = io('http://192.168.1.177:3002');

export const Messages = ({ route }) => {
  const [singleMessage, setSingleMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [notification, setNotification] = useState('');
  const { user } = useUser();
  const { item } = route.params; //string

  useEffect(() => {
    fetchMessages();

    socket.emit('joinRoom', item.id, (message) => {
      setNotification(message);
    });

    socket.on('receive-message', (msg) =>
      setChatMessages((prevMsg) => [...prevMsg, msg])
    );

    //cleanup
    return () => {
      socket.disconnect();
    };
  }, []);

  const addUserToCommunity = async (user) => {
    try {
      const res = await fetch(`${SERVERURL}/communities`, {
        method: 'POST',
        body: JSON.stringify(user),
        headers: { 'Content-Type': 'application/json' },
      });
      return await res.json();
    } catch (error) {
      console.log(error);
    }
  };
  const fetchMessages = async () => {
    try {
      fetch(`${SERVERURL}/messages/${item.id}`)
        .then((res) => {
          if (!res.ok) throw new Error('Something went wrong');
          return res.json();
        })
        .then((data) => {
          setChatMessages(data);
        });
    } catch (error) {
      console.log(error);
    }
  };

  const postMessage = async (msg) => {
    try {
      fetch(`${SERVERURL}/messages`, {
        method: 'POST',
        body: JSON.stringify(msg),
        headers: { 'Content-Type': 'application/json' },
      }).then((res) => {
        if (!res.ok) throw Error('Something went wrong');
        return res.json();
      });
      // .then((data) => {
      //   setMessage(data);
      // });
    } catch (error) {
      console.log(error);
    }
  };

  const handleSubmitMessage = useCallback(() => {
    let textNotEmpty = singleMessage.trim().length > 0;

    if (textNotEmpty) {
      const messageModel = {
        userId: user.id,
        content: singleMessage,
        communityId: item.id,
        createdAt: new Date(),
      };
      socket.emit('sendMessage', messageModel, item.id);
      setChatMessages((prevMsg) => [...prevMsg, messageModel]);
      postMessage(messageModel);
      addUserToCommunity({ userId: user.id, communityId: item.id });
      setSingleMessage('');
    } else {
      console.log('text empty');
    }
  }, [singleMessage]);

  return (
    <View style={styles.container}>
      <View style={styles.chat}>
        <FlatList
          data={chatMessages}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.messageBox}>
              <View style={styles.userDetail}>
                <View style={styles.image}></View>
                <Text style={styles.username}>{item.userId}</Text>
              </View>
              <Text style={styles.message}>{item.content}</Text>
            </View>
          )}
        />
      </View>

      <Text>{notification}</Text>
      <View>
        <TextInput
          style={styles.input}
          value={singleMessage}
          onSubmitEditing={() => handleSubmitMessage()}
          onChangeText={(msg) => setSingleMessage(msg)}
          placeholder="Write a message"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 10,
    backgroundColor: 'white',
    flex: 1,
  },
  chat: {
    flex: 1,
    marginHorizontal: 10,
  },
  messageBox: {
    padding: 20,
    marginVertical: 8,
    backgroundColor: '#F9FBFC',
    borderRadius: 5,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 1,
    shadowOffset: {
      height: 0.5,
      width: 1,
    },
  },
  input: {
    backgroundColor: '#F9FBFC',
    padding: 12,
    borderColor: '#A9A9A9',
    borderWidth: 1,
    borderRadius: 15,
    marginHorizontal: 10,
    height: 50,
  },
  text: {},
  image: {
    padding: 10,
    height: 45,
    width: 45,
    backgroundColor: 'blue',
    borderRadius: 50,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },

    elevation: 2,
  },
  userDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontWeight: 'bold',
    marginLeft: 5,
  },
  message: {
    marginTop: 15,
  },
});

//emit to get all msgs
