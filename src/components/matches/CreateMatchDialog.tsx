import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, MapPin } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  par: number;
  course_rating: number;
  slope_rating: number;
}

interface CreateMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  onMatchCreated: () => void;
}

const MATCH_FORMATS = [
  { value: 'stroke', label: 'Stroke Play' },
  { value: 'match', label: 'Match Play' },
  { value: 'scramble', label: 'Scramble' },
  { value: 'best_ball', label: 'Best Ball' },
  { value: 'alternate_shot', label: 'Alternate Shot' },
];

const HOLES_OPTIONS = [
  { value: '9', label: '9 Holes' },
  { value: '18', label: '18 Holes' },
];

export const CreateMatchDialog = ({
  open,
  onOpenChange,
  groupId,
  onMatchCreated,
}: CreateMatchDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [format, setFormat] = useState('stroke');
  const [holesPlayed, setHolesPlayed] = useState('18');
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setCoursesLoading(false);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
    course.city?.toLowerCase().includes(courseSearch.toLowerCase()) ||
    course.state?.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedCourse || !user) return;

    setIsSubmitting(true);
    try {
      const { data: match, error } = await supabase
        .from('matches')
        .insert({
          group_id: groupId,
          course_id: selectedCourse.id,
          format,
          holes_played: parseInt(holesPlayed),
          match_date: matchDate,
          created_by: user.id,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Match created! Now set up teams and handicaps.',
      });

      onOpenChange(false);
      onMatchCreated();
    } catch (error: any) {
      console.error('Error creating match:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create match',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCourses();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSelectedCourse(null);
      setCourseSearch('');
      setFormat('stroke');
      setHolesPlayed('18');
      setMatchDate(new Date().toISOString().split('T')[0]);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Match</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Course Selection */}
          <div className="space-y-2">
            <Label>Course</Label>
            {selectedCourse ? (
              <div className="p-3 bg-secondary rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{selectedCourse.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {[selectedCourse.city, selectedCourse.state].filter(Boolean).join(', ')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Par {selectedCourse.par} • Rating {selectedCourse.course_rating} / Slope {selectedCourse.slope_rating}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCourse(null)}
                  >
                    Change
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search courses..."
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 border border-border rounded-lg">
                  {coursesLoading ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Loading courses...
                    </div>
                  ) : filteredCourses.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No courses found
                    </div>
                  ) : (
                    filteredCourses.slice(0, 20).map((course) => (
                      <div
                        key={course.id}
                        className="p-3 hover:bg-secondary cursor-pointer transition-colors"
                        onClick={() => setSelectedCourse(course)}
                      >
                        <p className="font-medium text-foreground">{course.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {[course.city, course.state].filter(Boolean).join(', ')} • Par {course.par}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Format */}
          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                {MATCH_FORMATS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Holes */}
          <div className="space-y-2">
            <Label>Holes</Label>
            <Select value={holesPlayed} onValueChange={setHolesPlayed}>
              <SelectTrigger>
                <SelectValue placeholder="Select holes" />
              </SelectTrigger>
              <SelectContent>
                {HOLES_OPTIONS.map((h) => (
                  <SelectItem key={h.value} value={h.value}>
                    {h.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Match Date</Label>
            <Input
              type="date"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gradient-primary text-primary-foreground"
              onClick={handleSubmit}
              disabled={!selectedCourse || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Match'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
