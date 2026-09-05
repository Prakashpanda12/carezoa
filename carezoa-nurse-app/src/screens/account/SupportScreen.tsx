// ============================================================================
// SupportScreen — Support tickets
// ============================================================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import apiClient from '../../api/client';

interface Ticket {
  id: number;
  subject: string;
  status: string;
  created_at: string;
}

export function SupportScreen() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const response = await apiClient.get('/tickets');
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  };

  const handleSubmitTicket = async () => {
    if (subject.length < 4 || body.length < 10) {
      Alert.alert('Required', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/tickets', { subject, body });
      Alert.alert('Submitted', 'Your support ticket has been created.');
      setSubject('');
      setBody('');
      setShowNewTicket(false);
      loadTickets();
    } catch (error) {
      Alert.alert('Error', 'Failed to create ticket.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return colors.info;
      case 'in_progress':
        return colors.warning;
      case 'resolved':
        return colors.success;
      default:
        return colors.textMuted;
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Support</Text>

      <Button
        title="+ New Support Ticket"
        onPress={() => setShowNewTicket(!showNewTicket)}
        variant={showNewTicket ? 'outline' : 'primary'}
      />

      {showNewTicket && (
        <Card style={styles.newTicketCard}>
          <Text style={styles.cardTitle}>Create New Ticket</Text>
          <Input
            label="Subject"
            placeholder="Brief description of your issue"
            value={subject}
            onChangeText={setSubject}
          />
          <Input
            label="Description"
            placeholder="Describe your issue in detail..."
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={5}
          />
          <Button
            title="Submit Ticket"
            onPress={handleSubmitTicket}
            loading={loading}
          />
        </Card>
      )}

      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
        My Tickets
      </Text>
      {tickets.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No support tickets yet</Text>
        </Card>
      ) : (
        tickets.map((ticket) => (
          <Card key={ticket.id} style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketSubject}>{ticket.subject}</Text>
              <Badge
                label={ticket.status.replace('_', ' ')}
                color={getStatusColor(ticket.status)}
              />
            </View>
            <Text style={styles.ticketDate}>
              Created: {new Date(ticket.created_at).toLocaleDateString()}
            </Text>
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  newTicketCard: {
    padding: spacing.md,
    marginTop: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  ticketCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  ticketSubject: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  ticketDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});
