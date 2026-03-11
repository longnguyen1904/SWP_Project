    package com.tallt.marketplace.repository;

    import com.tallt.marketplace.entity.ProductVersion;
    import org.springframework.data.domain.Page;
    import org.springframework.data.domain.Pageable;
    import org.springframework.data.jpa.repository.JpaRepository;
    import org.springframework.stereotype.Repository;

    import java.util.Optional;

    @Repository
    public interface ProductVersionRepository extends JpaRepository<ProductVersion, Integer> {

        Page<ProductVersion> findByProduct_ProductID(Integer productId, Pageable pageable);

        Optional<ProductVersion> findTopByProduct_ProductIDOrderByCreatedAtDesc(Integer productId);

        long countByProduct_ProductID(Integer productId);
    }
