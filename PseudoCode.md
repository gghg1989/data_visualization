## Quad-tree Algorithm
Students: Yuzhou Feng
### Data Structure
It is assumed these structures are used.
```java
// Simple coordinate object to represent points and vectors
struct XY

  float x;
  float y;

  function __construct(float _x, float _y) ...

// Axis-aligned bounding box with half dimension and center
struct AABB

  XY center;
  float halfDimension;

  function __construct(XY center, float halfDimension) ...
  function containsPoint(XY point) ...
  function intersectsAABB(AABB other) ...
```
### QuadTree class
This class represents both one quad tree and the node where it is rooted.
```java
class QuadTree

  // Arbitrary constant to indicate how many elements can be stored in this quad tree node
  constant int QT_NODE_CAPACITY = 4;

  // Axis-aligned bounding box stored as a center with half-dimensions
  // to represent the boundaries of this quad tree
  AABB boundary;

  // Points in this quad tree node
  Array of XY [size = QT_NODE_CAPACITY] points;

  // Children
  QuadTree* northWest;
  QuadTree* northEast;
  QuadTree* southWest;
  QuadTree* southEast;

  // Methods
  function __construct(AABB _boundary) ..
  function insert(XY p) ..
  function subdivide() .. // create four children that fully divide this quad into four quads of equal area
  function queryRange(AABB range) ..
```
### Insertion
The following method inserts a point into the appropriate quad of a quadtree, splitting if necessary.
- Input: point(XY)
- Output: insersion success or not(Boolean)
```java
class QuadTree

  ...

  // Insert a point into the QuadTree
  function insert(XY p)
  
    // Ignore objects that do not belong in this quad tree
    if (!boundary.containsPoint(p))
      return false; // object cannot be added

    // If there is space in this quad tree and if doesn't have subdivisions, add the object here
    if (points.size < QT_NODE_CAPACITY && northWest == null)
    
      points.append(p);
      return true;
   

    // Otherwise, subdivide and then add the point to whichever node will accept it
    if (northWest == null)
      subdivide();
    //We have to add the points/data contained into this quad array to the new quads if we want that only 
    //the last node holds the data 

    if (northWest->insert(p)) return true;
    if (northEast->insert(p)) return true;
    if (southWest->insert(p)) return true;
    if (southEast->insert(p)) return true;

    // Otherwise, the point cannot be inserted for some unknown reason (this should never happen)
    return false;
 
```
### Query range
The following method finds all points contained within a range.
- Input: range(AABB)
- Output: points in range(Array)
```java
class QuadTree

  ...

  // Find all points that appear within a range
  function queryRange(AABB range)
  
    // Prepare an array of results
    Array of XY pointsInRange;

    // Automatically abort if the range does not intersect this quad
    if (!boundary.intersectsAABB(range))
      return pointsInRange; // empty list

    // Check objects at this quad level
    for (int p = 0; p < points.size; p++)
    
      if (range.containsPoint(points[p]))
        pointsInRange.append(points[p]);
   

    // Terminate here, if there are no children
    if (northWest == null)
      return pointsInRange;

    // Otherwise, add the points from the children
    pointsInRange.appendArray(northWest->queryRange(range));
    pointsInRange.appendArray(northEast->queryRange(range));
    pointsInRange.appendArray(southWest->queryRange(range));
    pointsInRange.appendArray(southEast->queryRange(range));

    return pointsInRange;
 
```

## Database CRUD Algorithm
Students: Yuzhou Feng

### Create entry to database
- Input: data subject(Map)
- Output: insersion success or not(Boolean)

```java
function add(Subject subject)
    boolean flag = false;
    String sql="insert";
    PreparedStatement pstmt = conn.prepareStatement(sql);
    int i = executeUpdateNumber;
    if(i>0)
      flag = true;
    return flag;
``` 
 
### Override
  public List<Subject> selectall() {
    List<Subject> list = new ArrayList<Subject>();
    String sql = "select * from tb_subject";
    PreparedStatement pstmt = conn.prepareStatement(sql);
    ResultSet rs = pstmt.executeQuery();
    loop (rs.next())
      list.add(subject);
    return list;
  }
  
  @Override
  public List<Subject> selectByID(String subjectID) {
    List<Subject> list = new ArrayList<Subject>();
    try {
      String sql = "select * from tb_subject where subjectID=?";
      PreparedStatement pstmt = conn.prepareStatement(sql);
      pstmt.setString(1,subjectID );
      ResultSet rs = pstmt.executeQuery();
      while(rs.next()) {
        Subject subject = new Subject();
        subject.setSubjectID(rs.getInt("subjectID"));
        subject.setSubjectTitle(rs.getString("subjectTitle"));
        subject.setSubjectOptionA(rs.getString("subjectOptionA"));
        subject.setSubjectOptionB(rs.getString("subjectOptionB"));
        subject.setSubjectOptionC(rs.getString("subjectOptionC"));
        subject.setSubjectOptionD(rs.getString("subjectOptionD"));
        subject.setSubjectAnswer(rs.getString("subjectAnswer"));
        subject.setSubjectParse(rs.getString("subjectParse"));
        list.add(subject);
      }
      rs.close();
      pstmt.close();
      conn.close();
    } catch (SQLException e) {
      e.printStackTrace();
    }
    
    return list;
  }
 
  @Override
  public boolean update( String subjectTitle,
      String subjectOptionA, String subjectOptionB,
      String subjectOptionC, String subjectOptionD, String subjectAnswer,
      String subjectParse) {
    boolean flag = false;
    try {
      String sql = "update tb_subject set subjectOptionA = '"+subjectOptionA+"',subjectOptionB = '"+subjectOptionB+"',subjectOptionC = '"+subjectOptionC+
          "',subjectOptionD = '"+subjectOptionD+"',subjectAnswer = '"+subjectAnswer+"',subjectParse = '"+subjectParse+"' where subjectTitle = '"+subjectTitle+"'";
      
      PreparedStatement pstmt = conn.prepareStatement(sql);
      int i = pstmt.executeUpdate();
      pstmt.close();
      conn.close();
      if(i>0)flag = true;
    } catch (SQLException e) {
      e.printStackTrace();
    }
    return flag;
  }
 
  @Override
  public boolean delete(int subjectID) {
    boolean flag = false;
    
    try {
      String sql = "delete from tb_subject where subjectID = '"+subjectID+"'";
      PreparedStatement pstmt = conn.prepareStatement(sql);
      int i = pstmt.executeUpdate();
      pstmt.close();
      conn.close();
      if(i>0) flag = true;
    } catch (SQLException e) {
      System.out.println("删除失败！");
      e.printStackTrace();
    }
    
    return flag;
  }