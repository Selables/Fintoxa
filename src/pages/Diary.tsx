import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getDiaryEntries, saveDiaryEntry, deleteDiaryEntry } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { BookHeart, Save, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Diary() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [content, setContent] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const entries = useMemo(() => {
    if (!user) return [];
    return getDiaryEntries(user.id);
  }, [user, refreshKey]);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const currentEntry = entries.find(e => e.date === dateStr);

  // Sync content when date changes
  const [lastDate, setLastDate] = useState(dateStr);
  if (dateStr !== lastDate) {
    setLastDate(dateStr);
    const entry = entries.find(e => e.date === dateStr);
    setContent(entry?.content || '');
  }

  const entryDates = new Set(entries.map(e => e.date));

  const handleSave = () => {
    if (!user) return;
    if (!content.trim()) {
      toast.error('Write something first');
      return;
    }
    saveDiaryEntry({ userId: user.id, date: dateStr, content: content.trim() });
    setRefreshKey(k => k + 1);
    toast.success('Diary entry saved');
  };

  const handleDelete = () => {
    if (!user) return;
    deleteDiaryEntry(user.id, dateStr);
    setContent('');
    setRefreshKey(k => k + 1);
    toast.success('Diary entry deleted');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <BookHeart className="w-6 h-6 text-chart-orange" /> Diary
        </h1>
        <p className="text-muted-foreground text-sm">Journal your thoughts, one day at a time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
        <Card className="shadow-card">
          <CardContent className="p-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={d => d && setSelectedDate(d)}
              className={cn("p-3 pointer-events-auto")}
              modifiers={{ hasEntry: (date) => entryDates.has(format(date, 'yyyy-MM-dd')) }}
              modifiersClassNames={{ hasEntry: 'bg-accent/30 font-bold text-accent-foreground' }}
            />
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading">
              {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your thoughts for this day..."
              className="min-h-[250px] resize-none"
            />
            <div className="flex gap-3">
              <Button onClick={handleSave} className="flex-1">
                <Save className="w-4 h-4 mr-1" /> Save Entry
              </Button>
              {currentEntry && (
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
